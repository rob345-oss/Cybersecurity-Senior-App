# Flutter App Deployment Guide

## Prerequisites

1. **Install Flutter** (if not already installed):
   - Download from: https://flutter.dev/docs/get-started/install
   - Follow installation instructions for your OS
   - Verify installation: `flutter doctor`

2. **Enable Flutter Web**:
   ```bash
   flutter config --enable-web
   ```

## Step-by-Step Deployment to Development Server

### 1. Add API Integration Dependencies

First, add HTTP package to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  http: ^1.1.0  # Add this for API calls
  flutter_dotenv: ^5.1.0  # Add this for environment variables
```

Then run:
```bash
flutter pub get
```

### 2. Configure API Endpoint

Create a `.env` file in the root of your Flutter project (same level as `pubspec.yaml`):

```env
API_URL=http://localhost:8000
API_KEY=your-secret-api-key-here
```

**Important:** Replace `your-secret-api-key-here` with the same API key you set in your backend `API_KEY` environment variable.

### 3. Update pubspec.yaml to Include .env File

Add this to your `pubspec.yaml`:

```yaml
flutter:
  uses-material-design: true
  assets:
    - .env  # Add this line
```

### 4. Build for Web

```bash
flutter build web
```

This creates a `build/web` directory with all the files you need to deploy.

### 5. Deploy to Development Server

#### Option A: Simple HTTP Server (Local Testing)

1. Install a simple HTTP server:
   ```bash
   # Using Python (if installed)
   cd build/web
   python -m http.server 8080
   
   # Or using Node.js http-server
   npx http-server build/web -p 8080
   ```

2. Access at: `http://localhost:8080`

#### Option B: Deploy to a Web Server (Production-like Development)

**For Apache:**
1. Copy the contents of `build/web` to your Apache document root (e.g., `/var/www/html/flutter-app`)
2. Configure Apache to serve the files

**For Nginx:**
1. Copy contents of `build/web` to your web directory (e.g., `/usr/share/nginx/html/flutter-app`)
2. Add location block to nginx config:
   ```nginx
   location /flutter-app {
       alias /usr/share/nginx/html/flutter-app;
       try_files $uri $uri/ /flutter-app/index.html;
   }
   ```

**For Node.js/Express:**
1. Install express and serve-static:
   ```bash
   npm install express serve-static
   ```
2. Create a simple server file:
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   
   app.use(express.static(path.join(__dirname, 'build/web')));
   
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'build/web', 'index.html'));
   });
   
   app.listen(8080, () => {
     console.log('Flutter app running on http://localhost:8080');
   });
   ```

### 6. Important Configuration Notes

**CORS Configuration:**
- Your backend already allows all origins (`allow_origins=["*"]`), so CORS should work
- If you encounter CORS issues, make sure your backend is running and accessible from your Flutter app's domain

**API URL Configuration:**
- For local development: Use `http://localhost:8000` or `http://127.0.0.1:8000`
- For remote development server: Use your server's IP/domain (e.g., `http://192.168.1.100:8000` or `https://dev.yourserver.com`)
- Update the `.env` file with the correct API URL before building

**API Key:**
- The API key in your Flutter app's `.env` file MUST match the `API_KEY` in your backend environment
- Never commit `.env` files to version control (add to `.gitignore`)

### 7. Rebuilding After Changes

Every time you make changes to your Flutter code or update the `.env` file, rebuild:

```bash
flutter build web
```

Then redeploy the `build/web` directory to your server.

## Quick Deploy Script Example

Create a `deploy.sh` script:

```bash
#!/bin/bash
# Build Flutter web app
flutter build web

# Deploy to server (adjust paths as needed)
# Option 1: Copy to local web server
cp -r build/web/* /var/www/html/flutter-app/

# Option 2: Copy to remote server via SCP
# scp -r build/web/* user@dev-server:/var/www/html/flutter-app/

echo "Deployment complete!"
```

Make it executable: `chmod +x deploy.sh`

## Troubleshooting

1. **Blank screen on load:**
   - Check browser console for errors
   - Verify API URL is correct
   - Ensure backend is running and accessible

2. **CORS errors:**
   - Verify backend CORS settings allow your Flutter app's origin
   - Check that backend is running

3. **API key errors:**
   - Verify `.env` file exists and has correct API_KEY
   - Rebuild after changing `.env` file
   - Check that backend API_KEY matches frontend API_KEY

4. **404 errors on routes:**
   - Flutter web uses client-side routing
   - Ensure your server is configured to serve `index.html` for all routes (see server configs above)

