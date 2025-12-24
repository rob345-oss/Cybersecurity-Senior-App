export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
}

export interface SafeScript {
  say_this: string;
  if_they_push_back: string;
}

export interface RiskResponse {
  score: number;
  level: string;
  reasons: string[];
  next_action: string;
  recommended_actions: RecommendedAction[];
  safe_script?: SafeScript;
  metadata?: Record<string, string>;
}

export interface SessionStartResponse {
  session_id: string;
}
