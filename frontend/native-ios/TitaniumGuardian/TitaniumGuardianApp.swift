import SwiftUI

@main
struct TitaniumGuardianApp: App {
    @StateObject private var sessionStore = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(sessionStore)
        }
    }
}
