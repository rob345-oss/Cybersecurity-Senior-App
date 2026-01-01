import Foundation

@MainActor
final class CallGuardViewModel: ObservableObject {
    @Published var selectedSignals: Set<String> = []
    @Published var risk: RiskResponse?

    private let client = APIClient()
    private var sessionId: String?

    func startSession() async {
        let request = SessionStartRequest(userId: UUID(), deviceId: "ios", module: "callguard", context: nil)
        do {
            let response: SessionStartResponse = try await client.post(path: "v1/session/start", body: request)
            sessionId = response.sessionId
        } catch {
            sessionId = nil
        }
    }

    func updateRisk() async {
        guard let sessionId else { return }
        for signal in selectedSignals {
            let event = EventRequest(type: "signal", payload: ["signal_key": signal], timestamp: ISO8601DateFormatter().string(from: Date()))
            do {
                risk = try await client.post(path: "v1/session/\(sessionId)/event", body: event)
            } catch {
                risk = nil
            }
        }
    }
}

struct SessionStartRequest: Codable {
    let userId: UUID
    let deviceId: String
    let module: String
    let context: [String: String]?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case deviceId = "device_id"
        case module
        case context
    }
}

struct SessionStartResponse: Codable {
    let sessionId: String

    enum CodingKeys: String, CodingKey {
        case sessionId = "session_id"
    }
}

struct EventRequest: Codable {
    let type: String
    let payload: [String: String]
    let timestamp: String
}
