import Foundation

struct RecommendedAction: Codable, Identifiable {
    let id: String
    let title: String
    let detail: String
}

struct SafeScript: Codable {
    let sayThis: String
    let ifTheyPushBack: String

    enum CodingKeys: String, CodingKey {
        case sayThis = "say_this"
        case ifTheyPushBack = "if_they_push_back"
    }
}

struct RiskResponse: Codable {
    let score: Int
    let level: String
    let reasons: [String]
    let nextAction: String
    let recommendedActions: [RecommendedAction]
    let safeScript: SafeScript?
    let metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case score
        case level
        case reasons
        case nextAction = "next_action"
        case recommendedActions = "recommended_actions"
        case safeScript = "safe_script"
        case metadata
    }
}

struct SessionSummary: Codable, Identifiable {
    let id = UUID()
    let sessionId: String
    let module: String
    let createdAt: Date
    let lastRisk: RiskResponse
    let keyTakeaways: [String]

    enum CodingKeys: String, CodingKey {
        case sessionId = "session_id"
        case module
        case createdAt = "created_at"
        case lastRisk = "last_risk"
        case keyTakeaways = "key_takeaways"
    }
}
