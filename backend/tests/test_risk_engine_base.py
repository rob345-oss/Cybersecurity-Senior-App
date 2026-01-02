"""
Comprehensive unit tests for risk_engine/base.py module.

Tests all utility functions: clamp_score, score_to_level, and build_risk_response.
"""
import sys
from pathlib import Path

# Add project root to path
# test_risk_engine_base.py is in backend/tests/
# So we need to go up 2 levels to get to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest
from backend.risk_engine.base import clamp_score, score_to_level, build_risk_response
from backend.models import RecommendedAction, RiskResponse


class TestClampScore:
    """Test clamp_score function."""
    
    def test_clamp_score_within_bounds(self):
        """Test scores within valid range (0-100)."""
        assert clamp_score(0) == 0
        assert clamp_score(50) == 50
        assert clamp_score(100) == 100
    
    def test_clamp_score_below_zero(self):
        """Test scores below 0 are clamped to 0."""
        assert clamp_score(-1) == 0
        assert clamp_score(-100) == 0
        assert clamp_score(-999) == 0
    
    def test_clamp_score_above_100(self):
        """Test scores above 100 are clamped to 100."""
        assert clamp_score(101) == 100
        assert clamp_score(200) == 100
        assert clamp_score(999) == 100


class TestScoreToLevel:
    """Test score_to_level function."""
    
    def test_low_risk_scores(self):
        """Test scores 0-34 map to 'low' risk."""
        assert score_to_level(0) == "low"
        assert score_to_level(34) == "low"
        assert score_to_level(17) == "low"
    
    def test_medium_risk_scores(self):
        """Test scores 35-69 map to 'medium' risk."""
        assert score_to_level(35) == "medium"
        assert score_to_level(50) == "medium"
        assert score_to_level(69) == "medium"
    
    def test_high_risk_scores(self):
        """Test scores 70-100 map to 'high' risk."""
        assert score_to_level(70) == "high"
        assert score_to_level(85) == "high"
        assert score_to_level(100) == "high"
    
    def test_boundary_values(self):
        """Test boundary values between risk levels."""
        assert score_to_level(34) == "low"
        assert score_to_level(35) == "medium"
        assert score_to_level(69) == "medium"
        assert score_to_level(70) == "high"


class TestBuildRiskResponse:
    """Test build_risk_response function."""
    
    def test_build_risk_response_minimal(self):
        """Test building response with minimal required fields."""
        reasons = ["Test reason"]
        next_action = "Test action"
        recommended_actions = [
            RecommendedAction(id="test-1", title="Action 1", detail="Detail 1")
        ]
        
        response = build_risk_response(
            score=50,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        
        assert isinstance(response, RiskResponse)
        assert response.score == 50
        assert response.level == "medium"
        assert response.reasons == reasons
        assert response.next_action == next_action
        assert response.recommended_actions == recommended_actions
        assert response.safe_script is None
        assert response.metadata == {}
    
    def test_build_risk_response_with_safe_script(self):
        """Test building response with safe script."""
        from backend.models import SafeScript
        
        reasons = ["Reason 1", "Reason 2"]
        next_action = "Next action"
        recommended_actions = [
            RecommendedAction(id="a1", title="Title", detail="Detail")
        ]
        safe_script = SafeScript(
            say_this="Say this",
            if_they_push_back="Push back response"
        )
        
        response = build_risk_response(
            score=75,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions,
            safe_script=safe_script
        )
        
        assert response.score == 75
        assert response.level == "high"
        assert response.safe_script == safe_script
        assert response.safe_script.say_this == "Say this"
        assert response.safe_script.if_they_push_back == "Push back response"
    
    def test_build_risk_response_with_metadata(self):
        """Test building response with metadata."""
        reasons = ["Test"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="m1", title="Title", detail="Detail")
        ]
        metadata = {
            "key1": "value1",
            "key2": 123,
            "key3": {"nested": "data"}
        }
        
        response = build_risk_response(
            score=30,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions,
            metadata=metadata
        )
        
        assert response.metadata == metadata
        assert response.metadata["key1"] == "value1"
        assert response.metadata["key2"] == 123
    
    def test_build_risk_response_score_clamping(self):
        """Test that scores are automatically clamped."""
        reasons = ["Test"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="c1", title="Title", detail="Detail")
        ]
        
        # Test negative score
        response_negative = build_risk_response(
            score=-10,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        assert response_negative.score == 0
        
        # Test score above 100
        response_high = build_risk_response(
            score=150,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        assert response_high.score == 100
    
    def test_build_risk_response_level_mapping(self):
        """Test that risk levels are correctly mapped from scores."""
        reasons = ["Test"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="l1", title="Title", detail="Detail")
        ]
        
        # Low risk
        response_low = build_risk_response(
            score=20,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        assert response_low.level == "low"
        
        # Medium risk
        response_medium = build_risk_response(
            score=50,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        assert response_medium.level == "medium"
        
        # High risk
        response_high = build_risk_response(
            score=80,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        assert response_high.level == "high"
    
    def test_build_risk_response_empty_metadata_default(self):
        """Test that metadata defaults to empty dict when None."""
        reasons = ["Test"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="e1", title="Title", detail="Detail")
        ]
        
        response = build_risk_response(
            score=50,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions,
            metadata=None
        )
        
        assert response.metadata == {}
    
    def test_build_risk_response_multiple_reasons(self):
        """Test building response with multiple reasons."""
        reasons = ["Reason 1", "Reason 2", "Reason 3", "Reason 4"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="r1", title="Title", detail="Detail")
        ]
        
        response = build_risk_response(
            score=60,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        
        assert len(response.reasons) == 4
        assert response.reasons == reasons
    
    def test_build_risk_response_multiple_actions(self):
        """Test building response with multiple recommended actions."""
        reasons = ["Test"]
        next_action = "Action"
        recommended_actions = [
            RecommendedAction(id="a1", title="Action 1", detail="Detail 1"),
            RecommendedAction(id="a2", title="Action 2", detail="Detail 2"),
            RecommendedAction(id="a3", title="Action 3", detail="Detail 3"),
        ]
        
        response = build_risk_response(
            score=70,
            reasons=reasons,
            next_action=next_action,
            recommended_actions=recommended_actions
        )
        
        assert len(response.recommended_actions) == 3
        assert response.recommended_actions[0].id == "a1"
        assert response.recommended_actions[1].id == "a2"
        assert response.recommended_actions[2].id == "a3"

