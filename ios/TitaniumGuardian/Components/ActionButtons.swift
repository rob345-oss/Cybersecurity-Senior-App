import SwiftUI

struct BigPrimaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
        }
    }
}

struct ChipGrid: View {
    let chips: [String]
    @Binding var selected: Set<String>

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), spacing: 12)], spacing: 12) {
            ForEach(chips, id: \.self) { chip in
                Button {
                    if selected.contains(chip) {
                        selected.remove(chip)
                    } else {
                        selected.insert(chip)
                    }
                } label: {
                    Text(chip)
                        .font(.footnote)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(selected.contains(chip) ? Color.blue.opacity(0.2) : Color(.secondarySystemBackground))
                        .cornerRadius(12)
                }
            }
        }
    }
}
