# Docker Setup Guide

This guide explains how to run the Titanium Guardian application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

## Quick Start

1. **Clone the repository** (if you haven't already)

2. **Set environment variables** (optional):
   Create a `.env` file in the root directory:
   ```bash
   API_KEY=your-api-key-here
   SESSION_TTL_HOURS=24
   ```

3. **Build and start services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Docker Compose Commands

### Start services in detached mode
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services
```bash
docker-compose down
```

### Rebuild services
```bash
docker-compose up --build
```

### Stop and remove volumes
```bash
docker-compose down -v
```

## Individual Dockerfiles

### Backend

The backend Dockerfile builds a Python FastAPI application.

**Build manually:**
```bash
docker build -f backend/Dockerfile -t titanium-guardian-backend .
```

**Run manually:**
```bash
docker run -p 8000:8000 \
  -e API_KEY=your-api-key \
  -e SESSION_TTL_HOURS=24 \
  titanium-guardian-backend
```

### Frontend

The frontend Dockerfile uses a multi-stage build:
1. Builds the Flutter web application
2. Serves it with nginx

**Build manually:**
```bash
docker build -f frontend/Dockerfile -t titanium-guardian-frontend ./frontend
```

**Run manually:**
```bash
docker run -p 8080:80 titanium-guardian-frontend
```

## Development Mode

The `docker-compose.yml` includes volume mounts for the backend to enable hot-reloading during development. For production, remove the volume mounts.

## Production Considerations

1. **Remove development volumes** from `docker-compose.yml`
2. **Set strong API keys** via environment variables
3. **Use Docker secrets** for sensitive data
4. **Configure proper CORS** origins in the backend
5. **Set up reverse proxy** (nginx/traefik) for production
6. **Enable HTTPS** with SSL certificates
7. **Use Docker healthchecks** (already configured)
8. **Set resource limits** in docker-compose.yml

## Troubleshooting

### Port already in use
If ports 8000 or 8080 are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Change host port
```

### Build failures
- Ensure Docker has enough resources (CPU, memory)
- Check that all required files are present
- Review build logs: `docker-compose build --no-cache`

### Frontend not connecting to backend
- Verify backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Ensure the frontend API configuration points to the correct backend URL

## Health Checks

Both services include health checks:
- **Backend**: Checks `/docs` endpoint
- **Frontend**: Checks nginx root

View health status:
```bash
docker-compose ps
```

