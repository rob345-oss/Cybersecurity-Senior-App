# Cybersecurity-Senior-App

A cybersecurity application for senior citizens with risk assessment capabilities for calls, money transfers, emails, and identity monitoring.

## Project Structure

This is a monorepo containing:

- **`backend/`** - Python FastAPI backend server
- **`frontend/`** - Flutter application (cross-platform: web, iOS, Android, desktop)
- **`docs/`** - Documentation files

## Setup

### Prerequisites

- Python 3.8+ (for backend)
- Flutter SDK (for frontend) - [Install Flutter](https://flutter.dev/docs/get-started/install)
- Node.js and npm (optional, only if using React web frontend in `frontend/src/`)

### Backend

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```bash
   export API_KEY=your-secret-api-key-here
   ```
   Or create a `.env` file:
   ```
   API_KEY=your-secret-api-key-here
   ```

3. Run the server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend (Flutter)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Get Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run the Flutter app:

   **For Web:**
   ```bash
   flutter run -d chrome
   # Or for web server mode:
   flutter run -d web-server --web-hostname=127.0.0.1 --web-port=8080
   ```

   **For iOS (macOS only):**
   ```bash
   flutter run -d ios
   ```

   **For Android:**
   ```bash
   flutter run -d android
   ```

   **For Desktop (Linux/Windows/macOS):**
   ```bash
   flutter run -d linux    # Linux
   flutter run -d windows  # Windows
   flutter run -d macos    # macOS
   ```

4. Configure API endpoint (if needed):
   
   The Flutter app should be configured to connect to the backend API. Update the API URL in the Flutter code to match your backend server address (default: `http://localhost:8000`).

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

The API also provides interactive Swagger documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Running Tests

**Backend tests:**
```bash
cd backend
pytest tests/
```

### Project Structure Details

- `backend/` - FastAPI backend with risk assessment engines
  - `risk_engine/` - Risk assessment modules (CallGuard, MoneyGuard, InboxGuard, IdentityWatch)
  - `storage/` - Storage abstractions (currently in-memory)
  - `tests/` - Backend tests

- `frontend/` - Flutter application
  - `lib/` - Flutter Dart source code
  - `ios/` - iOS-specific code and configurations
  - `android/` - Android-specific code and configurations
  - `web/` - Web-specific assets and configurations
  - `windows/`, `linux/`, `macos/` - Desktop platform configurations

- `docs/` - Documentation files

## Additional Resources

### Documentation
- [Architecture Documentation](docs/ARCHITECTURE.md) - System architecture and component diagrams
- [Deployment Guide](docs/DEPLOYMENT.md) - Comprehensive deployment guide for all platforms
- [API Documentation](docs/API.md) - Detailed API reference

### Quick Guides
- [Flutter Deployment Guide](FLUTTER_DEPLOYMENT.md) - Quick guide for deploying the Flutter app
- [Run Flutter App Guide](RUN_FLUTTER_APP.md) - Quick start guide for running the Flutter app
- [Docker Setup Guide](DOCKER.md) - Docker and Docker Compose setup

### Project Management
- [Action Items](ACTION_ITEMS.md) - Current action items and improvements
