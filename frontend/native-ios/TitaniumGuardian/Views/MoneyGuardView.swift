import SwiftUI

struct MoneyGuardView: View {
    @StateObject private var viewModel = MoneyGuardViewModel()
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Before you send money")
                        .font(.title2)
                        .fontWeight(.bold)

                    TextField("Amount", text: $viewModel.amount)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)

                    TextField("Payment method", text: $viewModel.paymentMethod)
                        .textFieldStyle(.roundedBorder)

                    TextField("Recipient", text: $viewModel.recipient)
                        .textFieldStyle(.roundedBorder)

                    TextField("Reason", text: $viewModel.reason)
                        .textFieldStyle(.roundedBorder)

                    Toggle("They contacted me first", isOn: $viewModel.didTheyContactYouFirst)
                    Toggle("Urgency present", isOn: $viewModel.urgencyPresent)
                    Toggle("Asked to keep it secret", isOn: $viewModel.askedToKeepSecret)
                    Toggle("Asked for verification code", isOn: $viewModel.askedForVerificationCode)
                    Toggle("Asked for remote access", isOn: $viewModel.askedForRemoteAccess)

                    TextField("Impersonation type", text: $viewModel.impersonationType)
                        .textFieldStyle(.roundedBorder)

                    BigPrimaryButton(title: "Assess Risk") {
                        Task {
                            await viewModel.assess()
                        }
                    }

                    if let risk = viewModel.risk {
                        RiskCard(risk: risk)
                        ShareLink(item: "Titanium Guardian MoneyGuard summary: \(risk.level) risk score \(risk.score).") {
                            Label("Share summary", systemImage: "square.and.arrow.up")
                        }
                        if let script = risk.safeScript {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Refusal script")
                                    .font(.headline)
                                Text(script.sayThis)
                                Text(script.ifTheyPushBack)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(16)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("MoneyGuard")
        }
        .onChange(of: viewModel.risk) { risk in
            guard let risk else { return }
            let summary = SessionSummary(
                sessionId: UUID().uuidString,
                module: "moneyguard",
                createdAt: Date(),
                lastRisk: risk,
                keyTakeaways: Array(risk.reasons.prefix(3))
            )
            sessionStore.addSession(summary, for: "moneyguard")
        }
    }
}
