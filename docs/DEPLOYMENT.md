# Deployment Guide

This comprehensive guide covers all deployment options for the Titanium Guardian application, including backend, frontend, and full-stack deployments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Production Deployment](#production-deployment)
7. [Cloud Platform Deployments](#cloud-platform-deployments)
8. [CI/CD Deployment](#cicd-deployment)
9. [Environment Configuration](#environment-configuration)
10. [Security Considerations](#security-considerations)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)
12. [Troubleshooting](#troubleshooting)

## Overview

The Titanium Guardian application consists of:
- **Backend**: Python FastAPI server (port 8000)
- **Frontend**: Flutter application (web, iOS, Android, desktop)

You can deploy these components independently or together using Docker Compose.

## Prerequisites

### For Backend Deployment
- Python 3.8 or higher
- pip package manager
- (Optional) Virtual environment (venv, conda, etc.)

### For Frontend Deployment
- Flutter SDK (latest stable version)
- Platform-specific tools:
  - **Web**: No additional tools required
  - **iOS**: Xcode (macOS only)
  - **Android**: Android Studio, JDK
  - **Desktop**: Platform-specific build tools

### For Docker Deployment
- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

### For Production
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- Reverse proxy (nginx, Apache, Traefik, etc.)
- Monitoring tools (optional)

## Backend Deployment

### Option 1: Direct Python Deployment

#### Step 1: Install Dependencies

```bash
# Navigate to project root
cd Cybersecurity-Senior-App

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 2: Configure Environment

Create a `.env` file in the project root:

```env
API_KEY=your-secret-api-key-here
SESSION_TTL_HOURS=24
```

**Security Note**: Use a strong, randomly generated API key in production. Never commit `.env` files to version control.

#### Step 3: Run the Server

**Development mode (with auto-reload):**
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Production mode (with multiple workers):**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Using Gunicorn (recommended for production):**

First, install Gunicorn:
```bash
pip install gunicorn
```

Then run:
```bash
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 2: Systemd Service (Linux)

Create a systemd service file for automatic startup:

```bash
sudo nano /etc/systemd/system/titanium-guardian-backend.service
```

Add the following content:

```ini
[Unit]
Description=Titanium Guardian Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Cybersecurity-Senior-App
Environment="PATH=/path/to/venv/bin"
Environment="API_KEY=your-api-key-here"
Environment="SESSION_TTL_HOURS=24"
ExecStart=/path/to/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable titanium-guardian-backend
sudo systemctl start titanium-guardian-backend
sudo systemctl status titanium-guardian-backend
```

### Option 3: Windows Service

Use NSSM (Non-Sucking Service Manager) to run as a Windows service:

1. Download NSSM from https://nssm.cc/download
2. Install the service:
```cmd
nssm install TitaniumGuardianBackend
```
3. Configure:
   - Path: `C:\path\to\venv\Scripts\python.exe`
   - Arguments: `-m uvicorn backend.main:app --host 0.0.0.0 --port 8000`
   - Working Directory: `C:\path\to\Cybersecurity-Senior-App`
   - Environment: `API_KEY=your-api-key-here`

### Option 4: Reverse Proxy Setup (Nginx)

Configure Nginx as a reverse proxy for the backend:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Frontend Deployment

### Web Deployment

#### Step 1: Build the Web App

```bash
cd frontend

# Build for production
flutter build web --release

# Build with specific renderer (if needed)
flutter build web --release --web-renderer html
# or
flutter build web --release --web-renderer canvaskit
```

The build output will be in `frontend/build/web/`.

#### Step 2: Configure API Endpoint

Before building, configure the API endpoint. Update the API URL in your Flutter code or use environment variables:

**Option A: Hardcode in code (not recommended for production)**
```dart
const String apiBaseUrl = 'https://api.yourdomain.com';
```

**Option B: Use environment variables (recommended)**

1. Add `flutter_dotenv` to `pubspec.yaml`:
```yaml
dependencies:
  flutter_dotenv: ^5.1.0
```

2. Create `.env` file:
```env
API_URL=https://api.yourdomain.com
API_KEY=your-api-key-here
```

3. Load in code:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

await dotenv.load(fileName: ".env");
String apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:8000';
```

#### Step 3: Deploy to Web Server

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/titanium-guardian;
    index index.html;

    # SPA routing support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Apache Configuration:**

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/titanium-guardian

    <Directory /var/www/titanium-guardian>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

**Deploy to Cloud Storage (AWS S3 + CloudFront):**

1. Build the app:
```bash
flutter build web --release
```

2. Upload to S3:
```bash
aws s3 sync build/web s3://your-bucket-name --delete
```

3. Configure CloudFront distribution pointing to S3 bucket
4. Set up custom domain and SSL certificate

**Deploy to Netlify:**

1. Build the app:
```bash
flutter build web --release
```

2. Create `netlify.toml`:
```toml
[build]
  publish = "build/web"
  command = "flutter build web --release"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. Deploy via Netlify CLI or connect GitHub repository

**Deploy to Vercel:**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `vercel.json`:
```json
{
  "buildCommand": "cd frontend && flutter build web --release",
  "outputDirectory": "frontend/build/web",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

3. Deploy:
```bash
vercel
```

### iOS Deployment

#### Prerequisites
- macOS with Xcode installed
- Apple Developer account ($99/year)
- iOS device or simulator for testing

#### Step 1: Configure iOS Settings

1. Open `frontend/ios/Runner.xcworkspace` in Xcode
2. Update bundle identifier in `Runner/Info.plist`
3. Configure signing certificates in Xcode project settings
4. Set deployment target (iOS 12.0 or higher recommended)

#### Step 2: Build for App Store

```bash
cd frontend

# Build iOS app
flutter build ios --release

# Or build IPA directly
flutter build ipa
```

#### Step 3: Archive and Upload

1. Open Xcode
2. Select "Any iOS Device" as target
3. Product → Archive
4. Distribute App → App Store Connect
5. Follow the upload process

#### Step 4: TestFlight Testing

1. Upload build to App Store Connect
2. Add testers in TestFlight section
3. Testers receive invitation email

### Android Deployment

#### Prerequisites
- Android Studio installed
- Java Development Kit (JDK)
- Android SDK
- Google Play Developer account ($25 one-time)

#### Step 1: Configure Android Settings

1. Update `frontend/android/app/build.gradle.kts`:
```kotlin
android {
    namespace = "com.example.frontend"
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.yourcompany.titaniumguardian"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
    
    signingConfigs {
        create("release") {
            storeFile = file("keystore.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "upload"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
```

2. Create keystore:
```bash
keytool -genkey -v -keystore frontend/android/app/keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

#### Step 2: Build APK/AAB

```bash
cd frontend

# Build APK (for direct installation)
flutter build apk --release

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

#### Step 3: Upload to Google Play

1. Go to Google Play Console
2. Create new app or select existing
3. Go to Production → Create new release
4. Upload the `.aab` file from `build/app/outputs/bundle/release/`
5. Fill in release notes and submit for review

### Desktop Deployment

#### Windows

```bash
cd frontend

# Build Windows app
flutter build windows --release

# Output: build/windows/runner/Release/frontend.exe
```

Create installer using Inno Setup or WiX Toolset.

#### macOS

```bash
cd frontend

# Build macOS app
flutter build macos --release

# Output: build/macos/Build/Products/Release/frontend.app
```

Create DMG for distribution:
```bash
# Install create-dmg
npm install -g create-dmg

# Create DMG
create-dmg build/macos/Build/Products/Release/frontend.app
```

#### Linux

```bash
cd frontend

# Build Linux app
flutter build linux --release

# Output: build/linux/x64/release/bundle/
```

Create AppImage or DEB package for distribution.

## Docker Deployment

### Quick Start with Docker Compose

1. **Set environment variables:**
```bash
# Create .env file
cat > .env << EOF
API_KEY=your-secret-api-key-here
SESSION_TTL_HOURS=24
EOF
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Access services:**
- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: titanium-guardian-backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      - API_KEY=${API_KEY}
      - SESSION_TTL_HOURS=${SESSION_TTL_HOURS:-24}
    networks:
      - titanium-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - API_URL=${API_URL:-http://localhost:8000}
    container_name: titanium-guardian-frontend
    restart: always
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - titanium-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

networks:
  titanium-network:
    driver: bridge
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Container Deployment

**Backend:**
```bash
docker build -f backend/Dockerfile -t titanium-guardian-backend .
docker run -d \
  --name titanium-backend \
  -p 8000:8000 \
  -e API_KEY=your-api-key \
  -e SESSION_TTL_HOURS=24 \
  --restart unless-stopped \
  titanium-guardian-backend
```

**Frontend:**
```bash
docker build -f frontend/Dockerfile -t titanium-guardian-frontend ./frontend
docker run -d \
  --name titanium-frontend \
  -p 8080:80 \
  --restart unless-stopped \
  titanium-guardian-frontend
```

## Production Deployment

### Production Checklist

- [ ] Set strong API keys
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure CORS properly (restrict origins)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up database (if migrating from in-memory storage)
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure session TTL appropriately
- [ ] Set up health checks
- [ ] Configure auto-scaling (if using cloud)
- [ ] Set up CI/CD pipeline
- [ ] Document runbooks

### Production Nginx Configuration

Complete nginx configuration for production:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=30r/s;

# Backend API
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    root /var/www/titanium-guardian;
    index index.html;

    location / {
        limit_req zone=web_limit burst=20 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

## Cloud Platform Deployments

### AWS Deployment

#### Option 1: EC2 + Elastic Beanstalk

1. **Backend:**
   - Create Elastic Beanstalk Python application
   - Upload backend code
   - Configure environment variables
   - Set up Application Load Balancer with SSL

2. **Frontend:**
   - Build Flutter web app
   - Upload to S3 bucket
   - Configure CloudFront distribution
   - Set up custom domain

#### Option 2: ECS/Fargate

1. Push Docker images to ECR:
```bash
aws ecr create-repository --repository-name titanium-guardian-backend
aws ecr create-repository --repository-name titanium-guardian-frontend

docker tag titanium-guardian-backend:latest \
  <account>.dkr.ecr.<region>.amazonaws.com/titanium-guardian-backend:latest

aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker push <account>.dkr.ecr.<region>.amazonaws.com/titanium-guardian-backend:latest
```

2. Create ECS task definitions
3. Set up ECS services with Fargate
4. Configure Application Load Balancer

#### Option 3: Lambda (Backend only)

Convert FastAPI to Lambda-compatible format using Mangum:

```python
from mangum import Mangum
from backend.main import app

handler = Mangum(app)
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment

1. **Build and push container:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/titanium-guardian-backend
gcloud builds submit --tag gcr.io/PROJECT_ID/titanium-guardian-frontend
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy titanium-guardian-backend \
  --image gcr.io/PROJECT_ID/titanium-guardian-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY=your-api-key
```

3. **Frontend to Cloud Storage + Cloud CDN:**
```bash
gsutil mb gs://titanium-guardian-frontend
gsutil -m cp -r build/web/* gs://titanium-guardian-frontend/
gsutil web set -m index.html -e 404.html gs://titanium-guardian-frontend
```

### Azure Deployment

#### App Service

1. **Backend:**
```bash
az webapp create --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name titanium-guardian-backend \
  --runtime "PYTHON:3.11"

az webapp config appsettings set \
  --resource-group myResourceGroup \
  --name titanium-guardian-backend \
  --settings API_KEY=your-api-key
```

2. **Frontend:**
   - Deploy to Azure Static Web Apps
   - Or use Azure Blob Storage + CDN

### Heroku Deployment

1. **Backend:**
```bash
# Create Procfile
echo "web: uvicorn backend.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create titanium-guardian-backend
heroku config:set API_KEY=your-api-key
git push heroku main
```

2. **Frontend:**
   - Build and deploy static files
   - Or use Heroku buildpack for Flutter

## CI/CD Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest tests/

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -f backend/Dockerfile -t titanium-backend:${{ github.sha }} .
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push titanium-backend:${{ github.sha }}

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - name: Build web app
        run: |
          cd frontend
          flutter pub get
          flutter build web --release
      - name: Deploy to server
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./frontend/build/web/

  deploy-backend:
    needs: build-backend
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            "docker pull titanium-backend:${{ github.sha }} && \
             docker stop titanium-backend || true && \
             docker rm titanium-backend || true && \
             docker run -d --name titanium-backend \
               -p 8000:8000 \
               -e API_KEY=${{ secrets.API_KEY }} \
               --restart unless-stopped \
               titanium-backend:${{ github.sha }}"
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - cd backend && pytest tests/

build-backend:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f backend/Dockerfile -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA .
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - ssh $SSH_USER@$SSH_HOST "docker-compose pull && docker-compose up -d"
  only:
    - main
```

## Environment Configuration

### Environment Variables

**Backend:**
- `API_KEY`: Secret API key for authentication (required)
- `SESSION_TTL_HOURS`: Session time-to-live in hours (default: 24)
- `LOG_LEVEL`: Logging level (default: INFO)
- `DATABASE_URL`: Database connection string (if using database)
- `REDIS_URL`: Redis connection string (if using Redis)

**Frontend:**
- `API_URL`: Backend API URL (required)
- `API_KEY`: API key for requests (required)

### Configuration Files

**Backend `.env` example:**
```env
API_KEY=your-very-secure-random-api-key-here
SESSION_TTL_HOURS=24
LOG_LEVEL=INFO
```

**Frontend `.env` example:**
```env
API_URL=https://api.yourdomain.com
API_KEY=your-very-secure-random-api-key-here
```

**Docker Compose `.env` example:**
```env
API_KEY=your-very-secure-random-api-key-here
SESSION_TTL_HOURS=24
API_URL=https://api.yourdomain.com
```

## Security Considerations

### API Security

1. **Use Strong API Keys:**
   ```bash
   # Generate secure API key
   openssl rand -hex 32
   ```

2. **Restrict CORS Origins:**
   Update `backend/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],  # Specific origins
       allow_credentials=True,
       allow_methods=["GET", "POST"],
       allow_headers=["*"],
   )
   ```

3. **Rate Limiting:**
   Install slowapi:
   ```bash
   pip install slowapi
   ```
   Add to backend:
   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   
   @app.post("/v1/moneyguard/assess")
   @limiter.limit("10/minute")
   def moneyguard_assess(...):
       ...
   ```

4. **Input Validation:**
   - Already implemented with Pydantic
   - Add additional sanitization if needed

5. **HTTPS Only:**
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS
   - Use HSTS headers

### Data Security

1. **Encrypt Sensitive Data:**
   - Use encryption at rest for stored data
   - Use TLS for data in transit

2. **Session Security:**
   - Set appropriate TTL
   - Clean up expired sessions
   - Consider using secure cookies if adding web sessions

3. **Secrets Management:**
   - Use environment variables
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault)
   - Never commit secrets to version control

## Monitoring and Maintenance

### Health Checks

**Backend health endpoint:**
```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sessions": store.get_session_count()
    }
```

**Monitor with:**
- Prometheus + Grafana
- Datadog
- New Relic
- CloudWatch (AWS)
- Application Insights (Azure)

### Logging

**Structured logging:**
```python
import logging
import json

logger = logging.getLogger(__name__)

def log_request(request_id, endpoint, status, duration):
    logger.info(json.dumps({
        "request_id": request_id,
        "endpoint": endpoint,
        "status": status,
        "duration_ms": duration
    }))
```

### Backup Strategy

1. **Session Data:**
   - Currently in-memory (lost on restart)
   - Migrate to database for persistence
   - Set up automated backups

2. **Configuration:**
   - Version control all configs
   - Document all environment variables
   - Keep backup of production configs

### Updates and Maintenance

1. **Regular Updates:**
   ```bash
   # Update Python dependencies
   pip list --outdated
   pip install --upgrade package-name
   
   # Update Flutter
   flutter upgrade
   flutter pub upgrade
   ```

2. **Security Patches:**
   - Monitor security advisories
   - Update dependencies regularly
   - Use `pip-audit` for Python
   - Use `npm audit` for Node.js dependencies

3. **Database Migrations:**
   - Plan migrations carefully
   - Test in staging first
   - Have rollback plan

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.8+)
- Verify all dependencies installed
- Check port 8000 is available
- Review error logs

**Frontend can't connect to backend:**
- Verify backend is running
- Check CORS configuration
- Verify API URL is correct
- Check firewall rules

**Docker build fails:**
- Ensure Docker has enough resources
- Check Dockerfile syntax
- Review build logs
- Try building without cache: `docker build --no-cache`

**Session data lost:**
- Expected behavior with in-memory storage
- Migrate to database for persistence
- Implement session backup if needed

**High memory usage:**
- Check session cleanup is running
- Reduce SESSION_TTL_HOURS
- Implement session limits
- Monitor for memory leaks

### Debug Commands

```bash
# Check backend logs
docker-compose logs -f backend

# Check frontend logs
docker-compose logs -f frontend

# Check container status
docker-compose ps

# Restart services
docker-compose restart

# View resource usage
docker stats

# Test API endpoint
curl http://localhost:8000/docs

# Test health check
curl http://localhost:8000/health
```

### Getting Help

- Check logs first
- Review documentation
- Search existing issues
- Create detailed bug report with:
  - Error messages
  - Steps to reproduce
  - Environment details
  - Logs (sanitized)

---

For more information, see:
- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Flutter Deployment Guide](../FLUTTER_DEPLOYMENT.md)
- [Docker Setup Guide](../DOCKER.md)

