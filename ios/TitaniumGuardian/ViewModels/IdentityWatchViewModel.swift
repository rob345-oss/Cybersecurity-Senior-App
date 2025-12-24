import Foundation

@MainActor
final class IdentityWatchViewModel: ObservableObject {
    @Published var emails: String = ""
    @Published var phones: String = ""
    @Published var profileId: String?
    @Published var risk: RiskResponse?
    @Published var signals: [String: Bool] = [
        "password_reset_unknown": false,
        "account_opened": false,
        "suspicious_inquiry": false,
        "reused_passwords": false,
        "clicked_suspicious_link": false,
        "ssn_requested_unexpectedly": false
    ]

    private let client = APIClient()

    func createProfile() async {
        let request = IdentityWatchProfileRequest(
            emails: emails.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) },
            phones: phones.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        )
        do {
            let response: IdentityWatchProfileResponse = try await client.post(path: "v1/identitywatch/profile", body: request)
            profileId = response.profileId
        } catch {
            profileId = nil
        }
    }

    func assessRisk() async {
        guard let profileId else { return }
        let request = IdentityWatchRiskRequest(profileId: profileId, signals: signals)
        do {
            risk = try await client.post(path: "v1/identitywatch/check_risk", body: request)
        } catch {
            risk = nil
        }
    }
}

struct IdentityWatchProfileRequest: Codable {
    let emails: [String]
    let phones: [String]
    let fullName: String? = nil
    let state: String? = nil

    enum CodingKeys: String, CodingKey {
        case emails
        case phones
        case fullName = "full_name"
        case state
    }
}

struct IdentityWatchProfileResponse: Codable {
    let profileId: String
    let created: Date

    enum CodingKeys: String, CodingKey {
        case profileId = "profile_id"
        case created
    }
}

struct IdentityWatchRiskRequest: Codable {
    let profileId: String
    let signals: [String: Bool]

    enum CodingKeys: String, CodingKey {
        case profileId = "profile_id"
        case signals
    }
}
