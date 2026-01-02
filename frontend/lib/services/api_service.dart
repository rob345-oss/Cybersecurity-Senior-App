import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000',
  );

  String? _accessToken;

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Map<String, String> _getHeaders({bool includeContentType = true}) {
    final headers = <String, String>{};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  Future<T> get<T>(String path, T Function(Map<String, dynamic>) fromJson) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$path'),
      headers: _getHeaders(includeContentType: false),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonData = json.decode(response.body) as Map<String, dynamic>;
      return fromJson(jsonData);
    } else {
      throw ApiException(
        _extractErrorMessage(response),
        response.statusCode,
      );
    }
  }

  Future<T> post<T>(
    String path,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/$path'),
      headers: _getHeaders(),
      body: json.encode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonData = json.decode(response.body) as Map<String, dynamic>;
      return fromJson(jsonData);
    } else {
      throw ApiException(
        _extractErrorMessage(response),
        response.statusCode,
      );
    }
  }

  String _extractErrorMessage(http.Response response) {
    try {
      final contentType = response.headers['content-type'];
      if (contentType != null && contentType.contains('application/json')) {
        final errorData = json.decode(response.body) as Map<String, dynamic>;
        if (errorData.containsKey('detail')) {
          return errorData['detail'] as String;
        }
        if (errorData.containsKey('message')) {
          return errorData['message'] as String;
        }
        if (errorData.containsKey('error')) {
          final error = errorData['error'];
          return error is String ? error : error.toString();
        }
      }
    } catch (_) {
      // Fall through to status-based message
    }

    // Generate user-friendly messages based on status code
    switch (response.statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again in a moment.';
      case 504:
        return 'Request timed out. Please try again.';
      default:
        return 'Request failed with status ${response.statusCode}. Please try again.';
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

