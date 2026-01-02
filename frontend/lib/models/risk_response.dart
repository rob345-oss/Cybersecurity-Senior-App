class RecommendedAction {
  final String id;
  final String title;
  final String detail;

  RecommendedAction({
    required this.id,
    required this.title,
    required this.detail,
  });

  factory RecommendedAction.fromJson(Map<String, dynamic> json) {
    return RecommendedAction(
      id: json['id'] as String,
      title: json['title'] as String,
      detail: json['detail'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'detail': detail,
    };
  }
}

class SafeScript {
  final String sayThis;
  final String ifTheyPushBack;

  SafeScript({
    required this.sayThis,
    required this.ifTheyPushBack,
  });

  factory SafeScript.fromJson(Map<String, dynamic> json) {
    return SafeScript(
      sayThis: json['say_this'] as String,
      ifTheyPushBack: json['if_they_push_back'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'say_this': sayThis,
      'if_they_push_back': ifTheyPushBack,
    };
  }
}

class RiskResponse {
  final int score;
  final String level;
  final List<String> reasons;
  final String nextAction;
  final List<RecommendedAction> recommendedActions;
  final SafeScript? safeScript;
  final Map<String, dynamic>? metadata;

  RiskResponse({
    required this.score,
    required this.level,
    required this.reasons,
    required this.nextAction,
    required this.recommendedActions,
    this.safeScript,
    this.metadata,
  });

  factory RiskResponse.fromJson(Map<String, dynamic> json) {
    return RiskResponse(
      score: json['score'] as int,
      level: json['level'] as String,
      reasons: (json['reasons'] as List<dynamic>).map((e) => e as String).toList(),
      nextAction: json['next_action'] as String,
      recommendedActions: (json['recommended_actions'] as List<dynamic>)
          .map((e) => RecommendedAction.fromJson(e as Map<String, dynamic>))
          .toList(),
      safeScript: json['safe_script'] != null
          ? SafeScript.fromJson(json['safe_script'] as Map<String, dynamic>)
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'level': level,
      'reasons': reasons,
      'next_action': nextAction,
      'recommended_actions': recommendedActions.map((e) => e.toJson()).toList(),
      if (safeScript != null) 'safe_script': safeScript!.toJson(),
      if (metadata != null) 'metadata': metadata,
    };
  }
}

class SessionStartResponse {
  final String sessionId;

  SessionStartResponse({required this.sessionId});

  factory SessionStartResponse.fromJson(Map<String, dynamic> json) {
    return SessionStartResponse(
      sessionId: json['session_id'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
    };
  }
}

