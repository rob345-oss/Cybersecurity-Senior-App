import Foundation

struct APIClient {
    let baseURL = URL(string: "http://localhost:8000")!

    func post<T: Codable, U: Codable>(path: String, body: T) async throws -> U {
        let url = baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(U.self, from: data)
    }
}
