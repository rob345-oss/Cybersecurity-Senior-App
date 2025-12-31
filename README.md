# Cybersecurity-Senior-App
App created by SWIFT for application testing

## Setup

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

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set environment variables:
   ```bash
   export VITE_API_URL=http://localhost:8000
   export VITE_API_KEY=your-secret-api-key-here
   ```
   Or create a `.env` file:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_API_KEY=your-secret-api-key-here
   ```
   Note: The `VITE_API_KEY` must match the `API_KEY` set in the backend.

3. Run the development server:
   ```bash
   npm run dev
   ```

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.