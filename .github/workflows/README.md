# CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. PR Checks (`pr-checks.yml`)

Runs on every pull request and push to main/develop/master branches.

**Jobs:**
- **Backend Tests**: Runs pytest on all backend tests
- **Backend Linting**: Checks code formatting with Black and runs flake8
- **Frontend Linting**: Runs `flutter analyze` on the Flutter codebase
- **Frontend Tests**: Runs `flutter test` on the Flutter codebase

### 2. Build Frontend (`build-frontend.yml`)

Builds the Flutter application for different platforms.

**Jobs:**
- **Build Web**: Builds Flutter web app and uploads artifacts
- **Build Android**: Builds Android APK and uploads artifacts
- **Build iOS**: Builds iOS app (without code signing) and uploads artifacts

**Triggers:**
- Push to main/develop/master
- Pull requests to main/develop/master
- Manual workflow dispatch

### 3. Deploy (`deploy.yml`)

Deploys the application to staging or production environments.

**Jobs:**
- **Deploy Backend**: 
  - Runs tests
  - Builds Docker image
  - Pushes to container registry (if configured)
  - Deploys to staging/production
- **Deploy Frontend**:
  - Builds Flutter web app
  - Deploys to staging/production

**Environments:**
- **Staging**: Triggered on pushes to `develop` branch
- **Production**: Triggered on pushes to `main` or `master` branch
- **Manual**: Can be triggered manually with environment selection

## Setup Instructions

### Required Secrets

For the deployment workflow to work, you need to configure the following secrets in your GitHub repository:

1. **Container Registry** (optional, for backend deployment):
   - `REGISTRY_URL`: Your container registry URL (e.g., `ghcr.io` or `docker.io`)
   - `REGISTRY_USERNAME`: Username for the registry
   - `REGISTRY_PASSWORD`: Password or token for the registry

2. **Deployment Credentials** (add as needed for your deployment platform):
   - AWS credentials, Firebase tokens, Kubernetes configs, etc.

### Environment Configuration

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Create two environments: `staging` and `production`
4. Add any required secrets or variables for each environment

### Customizing Deployment

The deployment workflow includes placeholder commands. You'll need to customize them based on your deployment platform:

**For AWS:**
```yaml
- name: Deploy to staging
  run: |
    aws s3 sync frontend/build/web s3://staging-bucket/
    aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**For Firebase:**
```yaml
- name: Deploy to staging
  run: |
    firebase deploy --only hosting:staging --token ${{ secrets.FIREBASE_TOKEN }}
```

**For Kubernetes:**
```yaml
- name: Deploy to staging
  run: |
    kubectl set image deployment/backend backend=${{ secrets.REGISTRY_URL }}/backend:${{ github.sha }} -n staging
```

**For Docker Compose / SSH:**
```yaml
- name: Deploy to staging
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.STAGING_HOST }}
    username: ${{ secrets.STAGING_USER }}
    key: ${{ secrets.STAGING_SSH_KEY }}
    script: |
      cd /app
      docker-compose pull
      docker-compose up -d
```

## Testing Locally

You can test the workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
# On macOS: brew install act
# On Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run PR checks workflow
act pull_request

# Run build workflow
act push

# Run deployment workflow
act workflow_dispatch
```

## Workflow Status Badges

Add these badges to your README.md:

```markdown
![PR Checks](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/PR%20Checks/badge.svg)
![Build Frontend](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20Frontend/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Deploy/badge.svg)
```

## Troubleshooting

### Backend tests failing
- Ensure all dependencies are in `requirements.txt`
- Check that test environment variables are set correctly
- Verify pytest is finding all test files

### Flutter build failing
- Ensure Flutter version matches your local development version
- Check that all Flutter dependencies are properly declared in `pubspec.yaml`
- Verify web support is enabled

### Deployment failing
- Check that all required secrets are configured
- Verify environment names match your GitHub environment setup
- Ensure deployment commands are correct for your platform

