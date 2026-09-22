import Foundation

@MainActor
final class MoneyGuardViewModel: ObservableObject {
    @Published var amount: String = ""
    @Published var paymentMethod: String = "zelle"
    @Published var recipient: String = ""
    @Published var reason: String = ""
    @Published var didTheyContactYouFirst = false
    @Published var urgencyPresent = false
    @Published var askedToKeepSecret = false
    @Published var askedForVerificationCode = false
    @Published var askedForRemoteAccess = false
    @Published var impersonationType: String = "none"
    @Published var risk: RiskResponse?

    private let client = APIClient()

    func assess() async {
        let request = MoneyGuardAssessRequest(
            amount: Double(amount) ?? 0,
            paymentMethod: paymentMethod,
            recipient: recipient,
            reason: reason,
            didTheyContactYouFirst: didTheyContactYouFirst,
            urgencyPresent: urgencyPresent,
            askedToKeepSecret: askedToKeepSecret,
            askedForVerificationCode: askedForVerificationCode,
            askedForRemoteAccess: askedForRemoteAccess,
            impersonationType: impersonationType
        )
        do {
            risk = try await client.post(path: "v1/moneyguard/assess", body: request)
        } catch {
            risk = nil
        }
    }
}

struct MoneyGuardAssessRequest: Codable {
    let amount: Double
    let paymentMethod: String
    let recipient: String
    let reason: String
    let didTheyContactYouFirst: Bool
    let urgencyPresent: Bool
    let askedToKeepSecret: Bool
    let askedForVerificationCode: Bool
    let askedForRemoteAccess: Bool
    let impersonationType: String

    enum CodingKeys: String, CodingKey {
        case amount
        case paymentMethod = "payment_method"
        case recipient
        case reason
        case didTheyContactYouFirst = "did_they_contact_you_first"
        case urgencyPresent = "urgency_present"
        case askedToKeepSecret = "asked_to_keep_secret"
        case askedForVerificationCode = "asked_for_verification_code"
        case askedForRemoteAccess = "asked_for_remote_access"
        case impersonationType = "impersonation_type"
    }
}
