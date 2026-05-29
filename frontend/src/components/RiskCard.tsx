import { RiskResponse } from '../types'
import RiskBadge from './RiskBadge'

interface RiskCardProps {
  risk: RiskResponse
}

export default function RiskCard({ risk }: RiskCardProps) {
  return (
    <div className="card risk-card">
      <div>
        <RiskBadge level={risk.level} score={risk.score} />
        <p className="helper-note mt-2">Next best action: {risk.next_action}</p>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Why we flagged this</h3>
        <ul className="risk-list">
          {risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      {risk.recommended_actions.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Recommended actions</h3>
          <div className="recommended">
            {risk.recommended_actions.map((action) => (
              <div key={action.id} className="recommended-item">
                <strong className="text-slate-900">{action.title}</strong>
                <p className="helper-note mt-1">{action.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {risk.safe_script && (
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
          <h3 className="mb-2 font-semibold text-slate-900">Safety script</h3>
          <p className="text-slate-700">{risk.safe_script.say_this}</p>
          <p className="helper-note mt-2">If they push back: {risk.safe_script.if_they_push_back}</p>
        </div>
      )}
    </div>
  )
}
