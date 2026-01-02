# Connection Troubleshooting Guide

If you're seeing connection errors (like Error Code: -102), follow these steps:

## 1. Verify Backend is Running

The frontend connects to the backend API at `http://localhost:8000` by default. Make sure the backend server is running:

```bash
# From the project root directory
python -m uvicorn backend.main:app --reload
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## 2. Check Backend URL

The frontend uses the `VITE_API_URL` environment variable. If your backend is running on a different port or URL, create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

Or if your backend is on a different port:
```env
VITE_API_URL=http://localhost:8080
```

## 3. Verify Backend is Accessible

Open your browser and navigate to:
- `http://localhost:8000/docs` - Should show the API documentation
- `http://localhost:8000/openapi.json` - Should return JSON

If these don't load, the backend isn't running or isn't accessible.

## 4. Check Browser Console

Open the browser developer console (F12) and look for:
- Network errors in the Console tab
- Failed requests in the Network tab
- The API URL being used (should log: `[API] Using backend URL: http://localhost:8000`)

## 5. Common Issues

### CORS Errors
If you see CORS errors, the backend CORS configuration should allow your frontend origin. The backend is configured to allow all origins in development mode by default.

### Connection Refused
This means the backend isn't running. Start it with:
```bash
python -m uvicorn backend.main:app --reload
```

### Timeout Errors
The frontend has a 10-second timeout. If requests are timing out:
- Check if the backend is responding slowly
- Verify there are no firewall issues
- Check if the backend URL is correct

## 6. Test Backend Connection

You can test if the backend is reachable by running:

```bash
curl http://localhost:8000/docs
```

Or in your browser, navigate directly to `http://localhost:8000/docs`.

## Still Having Issues?

1. Make sure both frontend and backend are running
2. Check that no other service is using port 8000
3. Verify your firewall isn't blocking localhost connections
4. Check the browser console for detailed error messages

