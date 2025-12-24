from __future__ import annotations

from typing import List

from backend.models import RecommendedAction, RiskResponse, RiskLevel


def clamp_score(score: int) -> int:
    return max(0, min(100, score))


def score_to_level(score: int) -> RiskLevel:
    if score >= 70:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def build_risk_response(
    score: int,
    reasons: List[str],
    next_action: str,
    recommended_actions: List[RecommendedAction],
    safe_script=None,
    metadata=None,
) -> RiskResponse:
    return RiskResponse(
        score=clamp_score(score),
        level=score_to_level(score),
        reasons=reasons,
        next_action=next_action,
        recommended_actions=recommended_actions,
        safe_script=safe_script,
        metadata=metadata or {},
    )
