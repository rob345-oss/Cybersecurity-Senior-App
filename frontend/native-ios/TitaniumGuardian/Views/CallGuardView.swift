import SwiftUI

struct CallGuardView: View {
    @StateObject private var viewModel = CallGuardViewModel()
    @EnvironmentObject private var sessionStore: SessionStore

    private let signals = [
        "urgency",
        "bank_impersonation",
        "government_impersonation",
        "tech_support",
        "remote_access_request",
        "verification_code_request",
        "gift_cards",
        "crypto_payment",
        "threats_or_arrest",
        "too_good_to_be_true",
        "asks_to_keep_secret",
        "caller_id_mismatch"
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Quick Actions")
                        .font(.headline)
                    VStack(spacing: 8) {
                        QuickActionRow(title: "I’m on a call — help me", subtitle: "Live coaching for suspicious callers")
                        QuickActionRow(title: "Before I send money", subtitle: "Check payment risk fast")
                        QuickActionRow(title: "Check a message or link", subtitle: "Inbox phishing triage")
                        QuickActionRow(title: "Identity protection steps", subtitle: "Freeze credit checklist")
                    }

                    Text("I’m on a call — help me")
                        .font(.title2)
                        .fontWeight(.bold)

                    ChipGrid(chips: signals, selected: $viewModel.selectedSignals)

                    BigPrimaryButton(title: "Start Live Session") {
                        Task {
                            await viewModel.startSession()
                            await viewModel.updateRisk()
                        }
                    }

                    if let risk = viewModel.risk {
                        RiskCard(risk: risk)
                        ShareLink(item: "Titanium Guardian CallGuard summary: \(risk.level) risk score \(risk.score).") {
                            Label("Share summary", systemImage: "square.and.arrow.up")
                        }
                        if let script = risk.safeScript {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Say this")
                                    .font(.headline)
                                Text(script.sayThis)
                                Text("If they push back")
                                    .font(.headline)
                                Text(script.ifTheyPushBack)
                            }
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("CallGuard")
        }
        .onChange(of: viewModel.risk) { risk in
            guard let risk else { return }
            let summary = SessionSummary(
                sessionId: UUID().uuidString,
                module: "callguard",
                createdAt: Date(),
                lastRisk: risk,
                keyTakeaways: Array(risk.reasons.prefix(3))
            )
            sessionStore.addSession(summary, for: "callguard")
        }
    }
}

struct QuickActionRow: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}
