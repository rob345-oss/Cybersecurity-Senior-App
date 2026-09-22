import Foundation

@MainActor
final class InboxGuardViewModel: ObservableObject {
    @Published var text: String = ""
    @Published var url: String = ""
    @Published var risk: RiskResponse?

    private let client = APIClient()

    func analyzeText() async {
        let request = InboxGuardTextRequest(text: text, channel: "sms")
        do {
            risk = try await client.post(path: "v1/inboxguard/analyze_text", body: request)
        } catch {
            risk = nil
        }
    }

    func analyzeURL() async {
        let request = InboxGuardURLRequest(url: url)
        do {
            risk = try await client.post(path: "v1/inboxguard/analyze_url", body: request)
        } catch {
            risk = nil
        }
    }
}

struct InboxGuardTextRequest: Codable {
    let text: String
    let channel: String
}

struct InboxGuardURLRequest: Codable {
    let url: String
}
