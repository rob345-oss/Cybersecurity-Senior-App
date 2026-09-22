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

### 3. Deploy GitHub Pages (`deploy-github-pages.yml`) — primary public site

Builds a static export of the Next.js app (`frontend/`) and publishes it to GitHub Pages.
**No extra secrets required** (uses `GITHUB_TOKEN`).

**Live URL after the first successful run:**
`https://rob345-oss.github.io/Cybersecurity-Senior-App/`

**One-time setup:** Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

### 4. Deploy (`deploy.yml`) — optional Vercel + Render

Runs on push to `main` / `master`. Skips with a warning when secrets are missing (Pages still deploys).

**Jobs:**
- **Deploy Backend to Render**: POSTs to `RENDER_DEPLOY_HOOK_URL`
- **Deploy Frontend to Vercel**: builds Next.js, then `vercel deploy --prod`

## Setup Instructions

### Optional secrets (for Vercel / Render — GitHub → Settings → Secrets and variables → Actions)

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel Project → Settings → General (or `.vercel/project.json` after `vercel link`) |
| `VERCEL_PROJECT_ID` | Same as above |
| `RENDER_DEPLOY_HOOK_URL` | Render Dashboard → `titanium-guardian-api` → Settings → Deploy Hook |

### Recommended repository variables (Actions → Variables)

- `NEXT_PUBLIC_API_URL` — public Render API URL (e.g. `https://titanium-guardian-api.onrender.com`)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — if using Supabase auth
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth web client

### One-time platform setup

1. **GitHub Pages** (works today): Settings → Pages → Source: GitHub Actions.
2. **Vercel** (optional): Import this repo (root `frontend`), or Cursor Agents → **Publish**.
3. **Render** (optional API): New → Blueprint → this repo (`render.yaml`).

### Environment Configuration

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments** (optional) or **Secrets and variables → Actions**
3. Add the secrets and variables listed above

### Customizing Deployment

**Vercel CLI (what CI runs):**
```bash
cd frontend
npx vercel@latest deploy --prod --token "$VERCEL_TOKEN" --yes
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

