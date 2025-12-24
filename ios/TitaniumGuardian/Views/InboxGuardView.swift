import SwiftUI

struct InboxGuardView: View {
    @StateObject private var viewModel = InboxGuardViewModel()
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Paste a message or URL")
                        .font(.title2)
                        .fontWeight(.bold)

                    TextEditor(text: $viewModel.text)
                        .frame(height: 120)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.2)))

                    BigPrimaryButton(title: "Analyze Message") {
                        Task {
                            await viewModel.analyzeText()
                        }
                    }

                    TextField("Paste a URL", text: $viewModel.url)
                        .textFieldStyle(.roundedBorder)

                    BigPrimaryButton(title: "Analyze URL") {
                        Task {
                            await viewModel.analyzeURL()
                        }
                    }

                    if let risk = viewModel.risk {
                        RiskCard(risk: risk)
                        ShareLink(item: "Titanium Guardian InboxGuard summary: \(risk.level) risk score \(risk.score).") {
                            Label("Share summary", systemImage: "square.and.arrow.up")
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("InboxGuard")
        }
        .onChange(of: viewModel.risk) { risk in
            guard let risk else { return }
            let summary = SessionSummary(
                sessionId: UUID().uuidString,
                module: "inboxguard",
                createdAt: Date(),
                lastRisk: risk,
                keyTakeaways: Array(risk.reasons.prefix(3))
            )
            sessionStore.addSession(summary, for: "inboxguard")
        }
    }
}
