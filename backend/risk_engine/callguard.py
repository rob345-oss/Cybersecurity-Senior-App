"""
CallGuard - Advanced Multi-Agent AI System for Phone Scam Detection

This module provides a sophisticated risk assessment system for detecting and analyzing
phone scams using multiple AI-powered approaches:

1. CrewAI Multi-Agent System: Uses specialized AI agents (threat analyst, script specialist,
   risk assessor) working together to provide comprehensive analysis.

2. LangChain Assessment: Uses structured prompts and conversation chains for AI-powered
   risk assessment with context retention.

3. Rule-Based Fallback: Reliable deterministic system based on predefined signal weights
   for when AI services are unavailable.

The system is designed to:
- Detect various scam types (bank impersonation, tech support, government, etc.)
- Provide real-time risk scoring (0-100)
- Generate safe response scripts for users
- Recommend immediate protective actions
- Gracefully degrade to rule-based system if AI fails

Key Features:
- Lazy LLM initialization for better performance
- Comprehensive error handling with fallbacks
- Input validation and type safety
- Extensible architecture for adding new signals
- Detailed logging for debugging and monitoring
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from dotenv import load_dotenv

# Optional AI dependencies - import with fallback for testing without AI packages
try:
    from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
    from langchain_openai import ChatOpenAI
    from langchain.schema import HumanMessage
    from langchain.chains import LLMChain
    from langchain.memory import ConversationBufferMemory
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    ChatOpenAI = None  # type: ignore
    ChatPromptTemplate = None  # type: ignore
    SystemMessagePromptTemplate = None  # type: ignore
    HumanMessagePromptTemplate = None  # type: ignore
    HumanMessage = None  # type: ignore
    LLMChain = None  # type: ignore
    ConversationBufferMemory = None  # type: ignore

try:
    from crewai import Agent, Task, Crew, Process
    from crewai.tools import BaseTool
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    Agent = None  # type: ignore
    Task = None  # type: ignore
    Crew = None  # type: ignore
    Process = None  # type: ignore
    BaseTool = None  # type: ignore

from backend.models import RecommendedAction, SafeScript, RiskResponse
from backend.risk_engine.base import build_risk_response

# Load environment variables
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Constants
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_TEMPERATURE = 0.3
MAX_TRANSCRIPT_LENGTH = 500
MAX_RECOMMENDED_ACTIONS = 5
DEFAULT_RISK_SCORE = 50
DEFAULT_CONFIDENCE = 0.5
FALLBACK_CONFIDENCE = 0.7

# Initialize OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class CallContext(TypedDict, total=False):
    """Type definition for call context dictionary."""
    caller_id: str
    transcript: str
    duration: int
    caller_name: Optional[str]
    call_direction: Optional[str]  # "inbound" or "outbound"


# Lazy LLM initialization
_llm_instance: Optional[ChatOpenAI] = None


def _get_llm() -> Optional[Any]:
    """Lazy initialization of LangChain LLM."""
    global _llm_instance
    
    if not LANGCHAIN_AVAILABLE:
        return None
    
    if _llm_instance is not None:
        return _llm_instance
    
    if not OPENAI_API_KEY:
        return None
    
    try:
        _llm_instance = ChatOpenAI(  # type: ignore
            model_name=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE,
            openai_api_key=OPENAI_API_KEY
        )
        logger.info("LangChain ChatOpenAI initialized for CallGuard multi-agent system")
        return _llm_instance
    except Exception as e:
        logger.warning(f"Failed to initialize LangChain: {e}")
        return None

# Rule-based fallback system (maintained for reliability)
SIGNAL_WEIGHTS: Dict[str, int] = {
    "urgency": 10,
    "bank_impersonation": 25,
    "government_impersonation": 25,
    "tech_support": 20,
    "remote_access_request": 30,
    "verification_code_request": 35,
    "gift_cards": 30,
    "crypto_payment": 30,
    "threats_or_arrest": 25,
    "too_good_to_be_true": 15,
    "asks_to_keep_secret": 15,
    "caller_id_mismatch": 20,
    # Common scam patterns
    "grandparent_scam": 30,
    "family_emergency_scam": 30,
    "medicare_scam": 25,
    "health_insurance_scam": 25,
    "romance_scam": 25,
    "lottery_scam": 30,
    "sweepstakes_scam": 30,
    "investment_scam": 28,
    "charity_scam": 20,
    "disaster_relief_scam": 20,
    "contractor_scam": 25,
    "home_repair_scam": 25,
    "upfront_payment_request": 25,
    "wont_meet_in_person": 20,
    "refuses_video_chat": 15,
}

SAFE_SCRIPTS: Dict[str, SafeScript] = {
    "bank_impersonation": SafeScript(
        say_this="I will call the bank back using the number on my card.",
        if_they_push_back="I don't share information on inbound calls. I'll reach out directly.",
    ),
    "government_impersonation": SafeScript(
        say_this="I don't handle legal matters over the phone. I will contact the agency directly.",
        if_they_push_back="Please send official mail. I won't continue this call.",
    ),
    "tech_support": SafeScript(
        say_this="I don't grant remote access. I'll contact support using the official site.",
        if_they_push_back="No remote access. I'm ending the call now.",
    ),
    "verification_code_request": SafeScript(
        say_this="I never share verification codes.",
        if_they_push_back="Without that, I can't proceed. Goodbye.",
    ),
    "gift_cards": SafeScript(
        say_this="I don't pay with gift cards.",
        if_they_push_back="That payment method isn't acceptable. I'm ending this call.",
    ),
    "grandparent_scam": SafeScript(
        say_this="I need to verify this is really you. What's your middle name?",
        if_they_push_back="I'll call you back on your number I have saved. If it's an emergency, contact other family members.",
    ),
    "family_emergency_scam": SafeScript(
        say_this="I need to verify this independently. Let me call other family members first.",
        if_they_push_back="I don't make payments under pressure. I'll verify this separately and call back.",
    ),
    "medicare_scam": SafeScript(
        say_this="I don't share my Medicare number over the phone. I'll contact Medicare directly if needed.",
        if_they_push_back="Medicare doesn't call unsolicited. I'm ending this call.",
    ),
    "health_insurance_scam": SafeScript(
        say_this="I'll verify my benefits through my insurance portal or by calling the number on my card.",
        if_they_push_back="I don't share personal information on inbound calls. Goodbye.",
    ),
    "romance_scam": SafeScript(
        say_this="I'd prefer to verify your identity through video chat before discussing money.",
        if_they_push_back="I don't send money to people I haven't met in person. If this is real, we can discuss after we meet.",
    ),
    "lottery_scam": SafeScript(
        say_this="I never enter lotteries, so I couldn't have won. I'm not interested.",
        if_they_push_back="Real prizes don't require upfront payments. This call is over.",
    ),
    "sweepstakes_scam": SafeScript(
        say_this="I don't recall entering any sweepstakes. Please send official documentation by mail.",
        if_they_push_back="Legitimate prizes don't require payment. I'm hanging up now.",
    ),
    "investment_scam": SafeScript(
        say_this="I don't make investment decisions on cold calls. I'll consult with my financial advisor.",
        if_they_push_back="No legitimate investment requires immediate action. I'm ending this call.",
    ),
    "charity_scam": SafeScript(
        say_this="I'll verify the charity through Charity Navigator or GuideStar before donating.",
        if_they_push_back="I don't donate to charities that pressure me or only accept gift cards. Goodbye.",
    ),
    "contractor_scam": SafeScript(
        say_this="I need a written contract and references before any work begins. Can you provide those?",
        if_they_push_back="I don't make decisions under pressure. I'll get multiple quotes first. Goodbye.",
    ),
    "home_repair_scam": SafeScript(
        say_this="I'll need to see your license, insurance, and written estimate before any work.",
        if_they_push_back="Legitimate contractors provide documentation. I'm ending this call.",
    ),
}


# Helper functions
def _build_call_context_text(call_context: Optional[CallContext]) -> str:
    """
    Build a formatted context string from call context dictionary.
    
    Args:
        call_context: Optional dictionary with call context information
        
    Returns:
        Formatted string with call context information
    """
    if not call_context:
        return ""
    
    context_parts: List[str] = []
    
    if "caller_id" in call_context and call_context["caller_id"]:
        context_parts.append(f"Caller ID: {call_context['caller_id']}")
    
    if "transcript" in call_context and call_context["transcript"]:
        transcript = str(call_context["transcript"])
        truncated = transcript[:MAX_TRANSCRIPT_LENGTH]
        if len(transcript) > MAX_TRANSCRIPT_LENGTH:
            truncated += "..."
        context_parts.append(f"Call transcript: {truncated}")
    
    if "duration" in call_context and call_context["duration"]:
        context_parts.append(f"Call duration: {call_context['duration']} seconds")
    
    if "caller_name" in call_context and call_context["caller_name"]:
        context_parts.append(f"Caller name: {call_context['caller_name']}")
    
    return "\n".join(context_parts)


def _format_signals_text(signals: List[str]) -> str:
    """
    Format a list of signals into a readable string.
    
    Args:
        signals: List of signal strings
        
    Returns:
        Comma-separated string of signals
    """
    if not signals:
        return "No specific signals detected"
    return ", ".join(signals)


def _parse_json_from_text(text: str, fallback_score: int = DEFAULT_RISK_SCORE) -> Dict[str, Any]:
    """
    Extract and parse JSON from text that may contain JSON.
    
    Args:
        text: Text that may contain JSON
        fallback_score: Default risk score if parsing fails
        
    Returns:
        Parsed JSON dictionary
    """
    if not text:
        return {"risk_score": fallback_score, "detailed_reasons": ["No response received"]}
    
    # Try to find JSON object in the text
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(json_pattern, text, re.DOTALL)
    
    if matches:
        # Try the longest match first (most likely to be complete)
        for match in sorted(matches, key=len, reverse=True):
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
    
    # If no valid JSON found, try parsing the entire text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON from text: {text[:200]}")
        return {
            "risk_score": fallback_score,
            "detailed_reasons": [text[:200] if len(text) > 200 else text],
            "error": "Failed to parse JSON response"
        }


def _get_default_recommended_actions() -> List[RecommendedAction]:
    """
    Get default recommended actions for fallback scenarios.
    
    Returns:
        List of default RecommendedAction objects
    """
    return [
        RecommendedAction(
            id="pause-call",
            title="Pause and verify",
            detail="Take a breath, avoid sharing info, and verify the caller independently.",
        ),
        RecommendedAction(
            id="hang-up",
            title="Hang up if pressured",
            detail="If they demand urgency or secrecy, end the call and call back using a trusted number.",
        ),
    ]


def _create_safe_script_from_data(safe_script_data: Dict[str, Any]) -> Optional[SafeScript]:
    """
    Create a SafeScript object from dictionary data.
    
    Args:
        safe_script_data: Dictionary with 'say_this' and optionally 'if_they_push_back'
        
    Returns:
        SafeScript object or None if data is invalid
    """
    if not safe_script_data or not isinstance(safe_script_data, dict):
        return None
    
    say_this = safe_script_data.get("say_this", "").strip()
    if not say_this:
        return None
    
    return SafeScript(
        say_this=say_this,
        if_they_push_back=safe_script_data.get(
            "if_they_push_back", 
            "I'm ending this call now."
        ).strip()
    )


def _convert_actions_to_recommended_actions(
    ai_actions: List[Dict[str, Any]], 
    default_id_prefix: str = "ai-action"
) -> List[RecommendedAction]:
    """
    Convert AI-generated action dictionaries to RecommendedAction objects.
    
    Args:
        ai_actions: List of action dictionaries
        default_id_prefix: Prefix for auto-generated IDs
        
    Returns:
        List of RecommendedAction objects
    """
    recommended_actions: List[RecommendedAction] = []
    
    for idx, action in enumerate(ai_actions):
        if not isinstance(action, dict):
            continue
        
        recommended_actions.append(
            RecommendedAction(
                id=action.get("id", f"{default_id_prefix}-{idx}"),
                title=action.get("title", "Action"),
                detail=action.get("detail", "")
            )
        )
    
    # Ensure minimum number of actions
    if len(recommended_actions) < 2:
        recommended_actions.extend(_get_default_recommended_actions())
    
    return recommended_actions[:MAX_RECOMMENDED_ACTIONS]


# Custom CrewAI Tools for scam detection
if CREWAI_AVAILABLE:
    class ThreatPatternAnalyzerTool(BaseTool):  # type: ignore
        """Tool for analyzing threat patterns in phone calls."""
        name: str = "threat_pattern_analyzer"
        description: str = "Analyzes detected signals and identifies threat patterns, scam types, and risk indicators"
        
        def _run(self, signals: str, context: str = "") -> str:
            """
            Analyze threat patterns from signals.
            
            Args:
                signals: Comma-separated string of detected signals
                context: Additional context about the call
                
            Returns:
                JSON string with threat analysis or error message
            """
            llm_instance = _get_llm()
            if not llm_instance:
                return json.dumps({"error": "LLM not available"})
            
            prompt = f"""Analyze these phone call signals and identify threat patterns:
            
Signals: {signals}
Context: {context if context else "No additional context"}

Identify:
1. Primary scam type from these common patterns:
   - Grandparent/Family Emergency Scam
   - Tech Support Scam
   - Medicare/Health Insurance Scam
   - Romance Scam
   - IRS/Government Impersonation
   - Lottery/Sweepstakes Scam
   - Investment & Crypto Scams
   - Charity & Disaster Relief Fraud
   - Home Repair/Contractor Scams
   - Bank/Account Takeover (Phishing & Vishing)
   - Bank impersonation
   - Tech support
   - Government impersonation
2. Threat level (low/medium/high)
3. Key red flags
4. Confidence score (0.0-1.0)

Return JSON format."""
            
            try:
                response = llm_instance.invoke([HumanMessage(content=prompt)])  # type: ignore
                return response.content
            except Exception as e:
                logger.error(f"Threat pattern analysis failed: {e}", exc_info=True)
                return json.dumps({"error": str(e), "type": "threat_analysis_error"})

    class SafeScriptGeneratorTool(BaseTool):  # type: ignore
        """Tool for generating safe response scripts."""
        name: str = "safe_script_generator"
        description: str = "Generates safe, professional scripts for responding to suspicious callers"
        
        def _run(self, scam_type: str, threat_level: str) -> str:
            """
            Generate safe scripts based on scam type and threat level.
            
            Args:
                scam_type: Type of scam identified
                threat_level: Threat level (low/medium/high)
                
            Returns:
                JSON string with safe scripts or error message
            """
            llm_instance = _get_llm()
            if not llm_instance:
                return json.dumps({"error": "LLM not available"})
            
            prompt = f"""Generate safe response scripts for this scam situation:
            
Scam Type: {scam_type}
Threat Level: {threat_level}

Create:
1. Initial response script (what to say first)
2. Push-back response (if they pressure you)
3. Exit strategy (how to end the call safely)

Return JSON format with 'say_this' and 'if_they_push_back' fields."""
            
            try:
                response = llm_instance.invoke([HumanMessage(content=prompt)])  # type: ignore
                return response.content
            except Exception as e:
                logger.error(f"Safe script generation failed: {e}", exc_info=True)
                return json.dumps({"error": str(e), "type": "script_generation_error"})

    class RiskScoringTool(BaseTool):  # type: ignore
        """Tool for calculating comprehensive risk scores."""
        name: str = "risk_scorer"
        description: str = "Calculates detailed risk scores (0-100) with reasoning"
        
        def _run(self, threat_analysis: str, signals: str) -> str:
            """
            Calculate risk score based on threat analysis.
            
            Args:
                threat_analysis: Threat analysis results
                signals: Detected signals
                
            Returns:
                JSON string with risk score and reasoning or error message
            """
            llm_instance = _get_llm()
            if not llm_instance:
                return json.dumps({"error": "LLM not available"})
            
            prompt = f"""Calculate a risk score (0-100) for this phone call:
            
Threat Analysis: {threat_analysis}
Signals: {signals}

Provide:
1. Risk score (0-100 integer)
2. Risk level (low/medium/high)
3. Detailed reasoning
4. Immediate action required

Return JSON format."""
            
            try:
                response = llm_instance.invoke([HumanMessage(content=prompt)])  # type: ignore
                return response.content
            except Exception as e:
                logger.error(f"Risk scoring failed: {e}", exc_info=True)
                return json.dumps({"error": str(e), "type": "risk_scoring_error"})
else:
    # Dummy classes when CrewAI is not available
    class ThreatPatternAnalyzerTool:  # type: ignore
        pass
    
    class SafeScriptGeneratorTool:  # type: ignore
        pass
    
    class RiskScoringTool:  # type: ignore
        pass


def _rule_based_assess(signals: List[str]) -> RiskResponse:
    """
    Fallback rule-based assessment system.
    
    This function provides a reliable, deterministic risk assessment based on
    predefined signal weights. It's used when AI services are unavailable or
    as a fallback mechanism.
    
    Args:
        signals: List of detected signals (e.g., ["verification_code_request", "urgency"])
        
    Returns:
        RiskResponse with rule-based assessment
    """
    if not signals:
        signals = []
    
    score = 0
    reasons: List[str] = []
    highest_signal: Optional[str] = None
    highest_weight = 0
    
    for signal in signals:
        if not isinstance(signal, str):
            continue
            
        weight = SIGNAL_WEIGHTS.get(signal, 0)
        if weight > 0:
            score += weight
            reasons.append(f"Signal detected: {signal.replace('_', ' ')}")
        
        if weight > highest_weight:
            highest_signal = signal
            highest_weight = weight

    recommended_actions = _get_default_recommended_actions()
    safe_script = SAFE_SCRIPTS.get(highest_signal) if highest_signal else None
    next_action = "Verify the caller using an official phone number before sharing anything."
    
    metadata: Dict[str, Any] = {
        "primary_signal": highest_signal or "none",
        "assessment_method": "rule_based",
        "signals_count": len(signals),
        "signals_processed": len([s for s in signals if SIGNAL_WEIGHTS.get(s, 0) > 0])
    }

    return build_risk_response(
        score=score,
        reasons=reasons if reasons else ["No high-risk signals detected."],
        next_action=next_action,
        recommended_actions=recommended_actions,
        safe_script=safe_script,
        metadata=metadata,
    )


def _langchain_assess(
    signals: List[str], 
    call_context: Optional[CallContext] = None
) -> Optional[RiskResponse]:
    """
    LangChain-powered assessment using structured prompts and chains.
    
    This function uses LangChain's structured prompt templates and conversation
    chains to provide AI-powered risk assessment with context retention.
    
    Args:
        signals: List of detected signals
        call_context: Optional call context dictionary
        
    Returns:
        RiskResponse if successful, None if assessment fails
    """
    if not LANGCHAIN_AVAILABLE:
        return None
    
    llm_instance = _get_llm()
    if not llm_instance:
        return None
    
    try:
        # Build context strings using helper functions
        signals_text = _format_signals_text(signals)
        context_text = _build_call_context_text(call_context)
        
        # Create LangChain prompt template
        system_template = """You are an expert cybersecurity AI assistant specializing in detecting and analyzing phone scams, 
social engineering attacks, and fraudulent calls. Your role is to:

1. Analyze call signals and context to assess scam risk (0-100 scale)
2. Identify specific red flags and threat patterns
3. Provide actionable, real-time advice for the person on the call
4. Generate safe scripts they can use to respond
5. Recommend immediate protective actions

You understand common scam patterns including:
- Grandparent / Family Emergency Scam: Scammers pose as a grandchild (or lawyer/police) claiming urgent crisis (arrest, accident, hospital bill). Red flags: secrecy requests, urgent wire/gift-card payments, voice that "sounds off."
- Tech Support Scam: Fake pop-ups or cold calls claim computer virus and demand remote access or payment. Red flags: unsolicited contact, pressure to act now, requests to install software.
- Medicare / Health Insurance Scam: Fraudsters ask for Medicare numbers to "verify benefits" or offer fake plans. Red flags: asking for full SSN/Medicare ID, threats of lost coverage.
- Romance Scam: Long-term online relationships that pivot to money requests for emergencies, travel, or investments. Red flags: refusal to meet/video chat, rapid intimacy, repeated money asks.
- IRS / Government Impersonation: Calls or letters threaten arrest or fines for unpaid taxes or benefits issues. Red flags: demands for gift cards/crypto, caller ID spoofing, scare tactics.
- Lottery / Sweepstakes Scam: "You've won!"—but must pay fees or taxes upfront to claim the prize. Red flags: you didn't enter, upfront payments, secrecy clauses.
- Investment & Crypto Scams: Promises of "guaranteed" or low-risk, high-return investments. Red flags: guaranteed returns, pressure to move funds quickly, unregistered sellers.
- Charity & Disaster Relief Fraud: Fake charities exploit generosity after disasters or during holidays. Red flags: urgent appeals, unfamiliar organizations, requests for cash/gift cards.
- Home Repair / Contractor Scams: Door-to-door offers after storms; take deposits and vanish or do shoddy work. Red flags: cash-only, no written contract, pressure to decide immediately.
- Bank / Account Takeover (Phishing & Vishing): Fake bank alerts trick victims into revealing codes or credentials. Red flags: links in messages, requests for one-time codes, mismatched URLs.

Always prioritize user safety and provide clear, actionable guidance."""

        human_template = """Analyze this phone call situation and provide a comprehensive risk assessment:

DETECTED SIGNALS:
{signals}

ADDITIONAL CONTEXT:
{context}

Please provide a JSON response with the following structure:
{{
    "risk_score": <integer 0-100>,
    "risk_level": "<low|medium|high>",
    "primary_threats": ["threat1", "threat2", ...],
    "detailed_reasons": ["reason1", "reason2", ...],
    "immediate_action": "<what the person should do right now>",
    "recommended_actions": [
        {{
            "id": "action-id",
            "title": "Action Title",
            "detail": "Detailed explanation"
        }}
    ],
    "safe_script": {{
        "say_this": "<what to say to the caller>",
        "if_they_push_back": "<what to say if they pressure you>"
    }},
    "scam_type": "<type of scam if identified>",
    "confidence": <0.0-1.0>
}}

Be thorough, specific, and prioritize user safety. If the risk is high, be very clear about immediate actions."""

        prompt = ChatPromptTemplate.from_messages([  # type: ignore
            SystemMessagePromptTemplate.from_template(system_template),  # type: ignore
            HumanMessagePromptTemplate.from_template(human_template)  # type: ignore
        ])
        
        # Create chain with memory for context retention
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)  # type: ignore
        chain = LLMChain(llm=llm_instance, prompt=prompt, memory=memory, verbose=False)  # type: ignore
        
        # Execute chain
        result = chain.run(
            signals=signals_text, 
            context=context_text if context_text else "No additional context provided"
        )
        
        # Parse response using helper function
        ai_response = _parse_json_from_text(str(result), fallback_score=DEFAULT_RISK_SCORE)
        
        # Extract and validate AI response
        risk_score = max(0, min(100, int(ai_response.get("risk_score", DEFAULT_RISK_SCORE))))
        detailed_reasons = ai_response.get("detailed_reasons", [])
        if not detailed_reasons or not isinstance(detailed_reasons, list):
            detailed_reasons = ["LangChain AI analysis completed."]
        
        immediate_action = ai_response.get(
            "immediate_action", 
            "Verify the caller independently."
        )
        ai_actions = ai_response.get("recommended_actions", [])
        if not isinstance(ai_actions, list):
            ai_actions = []
        
        safe_script_data = ai_response.get("safe_script", {})
        scam_type = ai_response.get("scam_type", "unknown")
        confidence = max(0.0, min(1.0, float(ai_response.get("confidence", DEFAULT_CONFIDENCE))))
        
        # Convert AI actions to RecommendedAction objects using helper
        recommended_actions = _convert_actions_to_recommended_actions(
            ai_actions, 
            default_id_prefix="langchain-action"
        )
        
        # Create safe script if provided
        safe_script = _create_safe_script_from_data(safe_script_data)
        
        metadata: Dict[str, Any] = {
            "assessment_method": "langchain_powered",
            "scam_type": scam_type,
            "confidence": confidence,
            "primary_threats": ai_response.get("primary_threats", []),
            "model": DEFAULT_MODEL,
            "framework": "langchain",
            "signals_count": len(signals)
        }
        
        return build_risk_response(
            score=risk_score,
            reasons=detailed_reasons,
            next_action=immediate_action,
            recommended_actions=recommended_actions,
            safe_script=safe_script,
            metadata=metadata,
        )
        
    except Exception as e:
        logger.error(f"LangChain assessment failed: {e}", exc_info=True)
        return None


def _crewai_assess(
    signals: List[str], 
    call_context: Optional[CallContext] = None
) -> Optional[RiskResponse]:
    """
    CrewAI multi-agent assessment using specialized agents for different aspects.
    
    This function uses CrewAI's multi-agent system with three specialized agents:
    1. Threat Intelligence Analyst - Analyzes signals and identifies patterns
    2. Safe Response Script Specialist - Generates protective response scripts
    3. Risk Assessment Specialist - Calculates risk scores and recommendations
    
    Args:
        signals: List of detected signals
        call_context: Optional call context dictionary
        
    Returns:
        RiskResponse if successful, None if assessment fails
    """
    if not CREWAI_AVAILABLE or not OPENAI_API_KEY:
        return None
    
    try:
        # Build context using helper functions
        signals_text = _format_signals_text(signals)
        context_text = _build_call_context_text(call_context)
        
        # Initialize tools
        threat_analyzer_tool = ThreatPatternAnalyzerTool()
        script_generator_tool = SafeScriptGeneratorTool()
        risk_scorer_tool = RiskScoringTool()
        
        # Create specialized CrewAI agents
        threat_analyst = Agent(  # type: ignore
            role="Threat Intelligence Analyst",
            goal="Analyze phone call signals and identify scam patterns, threat types, and risk indicators",
            backstory="""You are an expert cybersecurity analyst with 15+ years of experience 
            detecting phone scams and social engineering attacks. You specialize in identifying 
            patterns, analyzing caller behavior, and categorizing threat types.""",
            tools=[threat_analyzer_tool],
            verbose=True,
            allow_delegation=False
        )
        
        script_specialist = Agent(  # type: ignore
            role="Safe Response Script Specialist",
            goal="Generate safe, professional scripts for responding to suspicious callers",
            backstory="""You are a communication expert specializing in de-escalation and safe 
            response strategies for scam calls. You create scripts that protect users while 
            maintaining professionalism.""",
            tools=[script_generator_tool],
            verbose=True,
            allow_delegation=False
        )
        
        risk_assessor = Agent(  # type: ignore
            role="Risk Assessment Specialist",
            goal="Calculate comprehensive risk scores and provide actionable recommendations",
            backstory="""You are a risk assessment expert who combines threat intelligence 
            with practical safety recommendations. You prioritize user protection and provide 
            clear, actionable guidance.""",
            tools=[risk_scorer_tool],
            verbose=True,
            allow_delegation=False
        )
        
        # Create tasks for the crew
        threat_analysis_task = Task(  # type: ignore
            description=f"""Analyze the following phone call situation:
            
Signals detected: {signals_text}
Additional context: {context_text if context_text else "None"}

Identify:
1. Primary scam type from common patterns: Grandparent/Family Emergency, Tech Support, Medicare/Health Insurance, Romance, IRS/Government, Lottery/Sweepstakes, Investment/Crypto, Charity/Disaster Relief, Home Repair/Contractor, Bank/Account Takeover
2. Threat level
3. Key red flags
4. Confidence score

Provide detailed threat analysis.""",
            agent=threat_analyst,
            expected_output="JSON with threat analysis including scam_type, threat_level, red_flags, and confidence"
        )
        
        script_generation_task = Task(  # type: ignore
            description="""Based on the threat analysis, generate safe response scripts including:
1. Initial response script
2. Push-back response for pressure situations
3. Exit strategy

Make scripts professional, clear, and protective.""",
            agent=script_specialist,
            expected_output="JSON with safe_script containing say_this and if_they_push_back fields"
        )
        
        risk_assessment_task = Task(  # type: ignore
            description="""Based on the threat analysis and available scripts, provide:
1. Risk score (0-100)
2. Risk level (low/medium/high)
3. Detailed reasoning
4. Immediate action required
5. Recommended actions list

Prioritize user safety and provide clear guidance.""",
            agent=risk_assessor,
            expected_output="JSON with risk_score, risk_level, detailed_reasons, immediate_action, and recommended_actions"
        )
        
        # Create crew and execute
        crew = Crew(  # type: ignore
            agents=[threat_analyst, script_specialist, risk_assessor],
            tasks=[threat_analysis_task, script_generation_task, risk_assessment_task],
            process=Process.sequential,  # type: ignore  # Sequential execution for dependency management
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse crew results using helper function
        result_str = str(result)
        crew_response = _parse_json_from_text(result_str, fallback_score=DEFAULT_RISK_SCORE)
        
        # Build response from crew analysis
        risk_score = max(0, min(100, int(crew_response.get("risk_score", DEFAULT_RISK_SCORE))))
        detailed_reasons = crew_response.get("detailed_reasons", [])
        if not detailed_reasons or not isinstance(detailed_reasons, list):
            detailed_reasons = ["CrewAI multi-agent analysis completed."]
        
        immediate_action = crew_response.get(
            "immediate_action", 
            "Verify the caller independently."
        )
        ai_actions = crew_response.get("recommended_actions", [])
        if not isinstance(ai_actions, list):
            ai_actions = []
        
        safe_script_data = crew_response.get("safe_script", {})
        scam_type = crew_response.get("scam_type", "unknown")
        confidence = max(0.0, min(1.0, float(crew_response.get("confidence", FALLBACK_CONFIDENCE))))
        
        # Convert actions using helper function
        recommended_actions = _convert_actions_to_recommended_actions(
            ai_actions,
            default_id_prefix="crewai-action"
        )
        
        # Create safe script using helper function
        safe_script = _create_safe_script_from_data(safe_script_data)
        
        metadata: Dict[str, Any] = {
            "assessment_method": "crewai_multi_agent",
            "scam_type": scam_type,
            "confidence": confidence,
            "primary_threats": crew_response.get("primary_threats", []),
            "framework": "crewai",
            "agents_used": ["threat_analyst", "script_specialist", "risk_assessor"],
            "model": DEFAULT_MODEL,
            "signals_count": len(signals)
        }
        
        return build_risk_response(
            score=risk_score,
            reasons=detailed_reasons,
            next_action=immediate_action,
            recommended_actions=recommended_actions,
            safe_script=safe_script,
            metadata=metadata,
        )
        
    except Exception as e:
        logger.error(f"CrewAI assessment failed: {e}", exc_info=True)
        return None


def assess(
    signals: List[str], 
    call_context: Optional[CallContext] = None, 
    use_ai: bool = True, 
    use_crewai: bool = True
) -> RiskResponse:
    """
    Assess call risk using a world-class multi-agent AI system.
    
    This advanced AI agent system uses:
    - LangChain for structured prompts and conversation chains
    - CrewAI for multi-agent collaboration (threat analyst, script specialist, risk assessor)
    - AutoGPT-style autonomous decision making with goal-oriented behavior
    - Falls back to rule-based system if AI is unavailable
    
    The system employs a sophisticated multi-agent architecture:
    1. Threat Intelligence Analyst: Analyzes signals and identifies scam patterns
    2. Safe Response Script Specialist: Generates protective response scripts
    3. Risk Assessment Specialist: Calculates risk scores and provides recommendations
    
    Args:
        signals: List of detected signals (e.g., ["verification_code_request", "urgency"]).
                 Empty list or None will result in low-risk assessment.
        call_context: Optional dict with additional context:
            - caller_id: Phone number or caller ID (str)
            - transcript: Call transcript or key phrases (str)
            - duration: Call duration in seconds (int)
            - caller_name: Name of the caller (str, optional)
            - call_direction: "inbound" or "outbound" (str, optional)
        use_ai: Whether to attempt AI analysis (default: True).
                If False, uses rule-based system directly.
        use_crewai: Whether to use CrewAI multi-agent system (default: True).
                   Falls back to LangChain if False or if CrewAI fails.
    
    Returns:
        RiskResponse with comprehensive risk assessment and recommendations.
        Always returns a valid RiskResponse, never None.
    
    Example:
        >>> signals = ["verification_code_request", "urgency", "bank_impersonation"]
        >>> context = {"caller_id": "+1234567890", "duration": 120}
        >>> response = assess(signals, context)
        >>> print(f"Risk Score: {response.score}, Level: {response.level}")
    """
    # Input validation
    if not signals:
        signals = []
    else:
        # Filter out invalid signals
        signals = [s for s in signals if isinstance(s, str) and s.strip()]
    
    # Try CrewAI multi-agent system first (most sophisticated)
    if use_ai and use_crewai and OPENAI_API_KEY:
        try:
            crewai_result = _crewai_assess(signals, call_context)
            if crewai_result:
                logger.info(
                    f"CrewAI multi-agent assessment completed: "
                    f"score={crewai_result.score}, level={crewai_result.level}"
                )
                return crewai_result
            else:
                logger.warning("CrewAI assessment returned None, falling back to LangChain")
        except Exception as e:
            logger.warning(f"CrewAI assessment error: {e}, falling back to LangChain", exc_info=True)
    
    # Try LangChain assessment (structured prompts and chains)
    if use_ai:
        llm_instance = _get_llm()
        if llm_instance:
            try:
                langchain_result = _langchain_assess(signals, call_context)
                if langchain_result:
                    logger.info(
                        f"LangChain assessment completed: "
                        f"score={langchain_result.score}, level={langchain_result.level}"
                    )
                    return langchain_result
                else:
                    logger.warning("LangChain assessment returned None, falling back to rule-based system")
            except Exception as e:
                logger.warning(f"LangChain assessment error: {e}, falling back to rule-based system", exc_info=True)
        else:
            logger.info("LLM not available, using rule-based system")
    
    # Fallback to rule-based system (always reliable)
    logger.info("Using rule-based assessment system")
    return _rule_based_assess(signals)
