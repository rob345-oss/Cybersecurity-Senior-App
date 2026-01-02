import { RiskResponse } from '../api'
import RiskBadge from './RiskBadge'

interface RiskCardProps {
  risk: RiskResponse
}

export default function RiskCard({ risk }: RiskCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <RiskBadge level={risk.level} score={risk.score} />
        <p className="text-sm text-gray-600 mt-3">Next best action: {risk.next_action}</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Why we flagged this</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {risk.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>
      
      {risk.recommended_actions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended actions</h3>
          <div className="space-y-3">
            {risk.recommended_actions.map((action) => (
              <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <strong className="text-gray-900 block mb-1">{action.title}</strong>
                <p className="text-sm text-gray-600">{action.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {risk.safe_script && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety script</h3>
          <p className="text-gray-700 mb-2">{risk.safe_script.say_this}</p>
          <p className="text-sm text-gray-600">If they push back: {risk.safe_script.if_they_push_back}</p>
        </div>
      )}
    </div>
  )
}

