import SwiftUI

struct IdentityWatchView: View {
    @StateObject private var viewModel = IdentityWatchViewModel()
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("IdentityWatch Profile")
                        .font(.title2)
                        .fontWeight(.bold)

                    TextField("Emails (comma separated)", text: $viewModel.emails)
                        .textFieldStyle(.roundedBorder)

                    TextField("Phones (comma separated)", text: $viewModel.phones)
                        .textFieldStyle(.roundedBorder)

                    BigPrimaryButton(title: "Create Profile") {
                        Task {
                            await viewModel.createProfile()
                        }
                    }

                    if let profileId = viewModel.profileId {
                        Text("Profile ID: \(profileId)")
                            .font(.footnote)
                            .foregroundColor(.secondary)

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Something happened")
                                .font(.headline)
                            ForEach(viewModel.signals.keys.sorted(), id: \.self) { key in
                                Toggle(key.replacingOccurrences(of: "_", with: " "), isOn: Binding(
                                    get: { viewModel.signals[key, default: false] },
                                    set: { viewModel.signals[key] = $0 }
                                ))
                            }
                        }

                        BigPrimaryButton(title: "Check Risk") {
                            Task {
                                await viewModel.assessRisk()
                            }
                        }
                    }

                    if let risk = viewModel.risk {
                        RiskCard(risk: risk)
                        ShareLink(item: "Titanium Guardian IdentityWatch summary: \(risk.level) risk score \(risk.score).") {
                            Label("Share summary", systemImage: "square.and.arrow.up")
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("IdentityWatch")
        }
        .onChange(of: viewModel.risk) { risk in
            guard let risk else { return }
            let summary = SessionSummary(
                sessionId: UUID().uuidString,
                module: "identitywatch",
                createdAt: Date(),
                lastRisk: risk,
                keyTakeaways: Array(risk.reasons.prefix(3))
            )
            sessionStore.addSession(summary, for: "identitywatch")
        }
    }
}
