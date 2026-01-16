# How to Test Database Connection

## Method 1: Using the Web Interface (Recommended)

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000/test-connection
   ```

3. **Click the "Test Connection" button**

4. **Check the results**:
   - ✅ Green box = Connection successful
   - ❌ Red box = Connection failed (shows error details)

## Method 2: Using the API Directly

You can test the connection via the API endpoint:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open a new terminal** and run:
   ```bash
   curl http://localhost:3000/api/test-connection
   ```

   Or in PowerShell:
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/test-connection | Select-Object -ExpandProperty Content
   ```

3. **Or use your browser** to visit:
   ```
   http://localhost:3000/api/test-connection
   ```

## Method 3: Quick Terminal Test

Run this PowerShell command to test the connection:

```powershell
Start-Sleep -Seconds 5; Invoke-WebRequest -Uri http://localhost:3000/api/test-connection -UseBasicParsing | Select-Object -ExpandProperty Content
```

## What the Test Checks

The connection test verifies:
- ✅ Environment variables are loaded (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ Can connect to your Supabase database
- ✅ Can query the database tables (subjects or levels table)

## Expected Results

### Success Response:
```json
{
  "success": true,
  "message": "Database connection successful!",
  "details": {
    "url": "Set",
    "key": "Set"
  }
}
```

### Failure Response:
```json
{
  "success": false,
  "error": "Error message here",
  "details": {
    "url": "Set" or "Missing",
    "key": "Set" or "Missing"
  }
}
```

## Troubleshooting

### If you get "Connection Failed":
1. **Check environment variables**: Make sure `.env.local` exists in the project root
2. **Restart the server**: Stop (Ctrl+C) and restart `npm run dev`
3. **Verify Supabase credentials**: Double-check your URL and key in `.env.local`
4. **Check database tables**: Make sure you've run the migration scripts in Supabase

### If the page doesn't load:
1. Make sure the dev server is running
2. Check if port 3000 is available
3. Try accessing `http://localhost:3000` first to see if the server is up
