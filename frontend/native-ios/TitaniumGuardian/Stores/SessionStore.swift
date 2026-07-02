import Foundation

final class SessionStore: ObservableObject {
    @Published private(set) var recentSessions: [String: [SessionSummary]] = [:]

    func addSession(_ session: SessionSummary, for module: String) {
        var items = recentSessions[module, default: []]
        items.insert(session, at: 0)
        if items.count > 20 {
            items = Array(items.prefix(20))
        }
        recentSessions[module] = items
    }
}
