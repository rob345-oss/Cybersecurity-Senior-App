# Frontend - Flutter Application

Cross-platform cybersecurity application built with Flutter.

## Features

- CallGuard - Assess risk of incoming calls
- MoneyGuard - Assess risk of money transfer requests
- InboxGuard - Analyze email/phishing threats
- IdentityWatch - Monitor and verify identity information

## Getting Started

### Prerequisites

- Flutter SDK installed and configured
- Backend API server running (see root README.md)

### Installation

1. Install Flutter dependencies:
   ```bash
   flutter pub get
   ```

2. Run the app:
   ```bash
   # For web
   flutter run -d chrome

   # For mobile/desktop
   flutter run
   ```

### Project Structure

- `lib/` - Main application code
  - `main.dart` - Application entry point
  - `screens/` - Screen widgets
  - `widgets/` - Reusable widget components

- `ios/` - iOS platform configuration
- `android/` - Android platform configuration
- `web/` - Web platform configuration
- `windows/`, `linux/`, `macos/` - Desktop platform configurations

## Building for Production

### Web
```bash
flutter build web
```
Output will be in `build/web/`

### iOS
```bash
flutter build ios
```

### Android
```bash
flutter build apk  # APK
flutter build appbundle  # App Bundle for Play Store
```

### Desktop
```bash
flutter build windows
flutter build linux
flutter build macos
```

## Configuration

The app connects to the backend API. Ensure the backend is running and accessible. The default API URL is `http://localhost:8000`.
