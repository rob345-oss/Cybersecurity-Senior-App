import SwiftUI

struct RiskBadge: View {
    let level: String
    let score: Int

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text("\(level.capitalized) • \(score)")
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
    }

    private var color: Color {
        switch level {
        case "high": return .red
        case "medium": return .orange
        default: return .green
        }
    }
}
