import SwiftUI

struct RiskCard: View {
    let risk: RiskResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RiskBadge(level: risk.level, score: risk.score)
            Text(risk.nextAction)
                .font(.headline)
            RiskExplanationList(reasons: risk.reasons)
            RecommendedActionsList(actions: risk.recommendedActions)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}

struct RiskExplanationList: View {
    let reasons: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Why this matters")
                .font(.subheadline)
                .fontWeight(.semibold)
            ForEach(reasons, id: \.self) { reason in
                Text("• \(reason)")
                    .font(.footnote)
            }
        }
    }
}

struct RecommendedActionsList: View {
    let actions: [RecommendedAction]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recommended actions")
                .font(.subheadline)
                .fontWeight(.semibold)
            ForEach(actions) { action in
                VStack(alignment: .leading, spacing: 2) {
                    Text(action.title)
                        .font(.footnote)
                        .fontWeight(.semibold)
                    Text(action.detail)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}
