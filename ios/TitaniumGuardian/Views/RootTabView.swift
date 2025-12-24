import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            CallGuardView()
                .tabItem {
                    Label("CallGuard", systemImage: "phone.fill")
                }

            MoneyGuardView()
                .tabItem {
                    Label("MoneyGuard", systemImage: "dollarsign.circle.fill")
                }

            InboxGuardView()
                .tabItem {
                    Label("InboxGuard", systemImage: "envelope.fill")
                }

            IdentityWatchView()
                .tabItem {
                    Label("IdentityWatch", systemImage: "person.crop.circle.fill")
                }
        }
    }
}
