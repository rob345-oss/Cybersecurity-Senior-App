import { RiskResponse } from "../types";
import RiskBadge from "./RiskBadge";

interface RiskCardProps {
  risk: RiskResponse;
}

export default function RiskCard({ risk }: RiskCardProps) {
  return (
    <div className="card risk-card">
      <div>
        <RiskBadge level={risk.level} score={risk.score} />
        <p className="helper-note">Next best action: {risk.next_action}</p>
      </div>
      <div>
        <h3>Why we flagged this</h3>
        <ul className="risk-list">
          {risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      {risk.recommended_actions.length > 0 && (
        <div>
          <h3>Recommended actions</h3>
          <div className="recommended">
            {risk.recommended_actions.map((action) => (
              <div key={action.id} className="recommended-item">
                <strong>{action.title}</strong>
                <p className="helper-note">{action.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {risk.safe_script && (
        <div>
          <h3>Safety script</h3>
          <p>{risk.safe_script.say_this}</p>
          <p className="helper-note">If they push back: {risk.safe_script.if_they_push_back}</p>
        </div>
      )}
    </div>
  );
}
