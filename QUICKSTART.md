# Quick Start Guide

Get the No-Code Architects Toolkit Dashboard running in minutes!

## 🚀 Method 1: Development Mode (Fastest)

### Prerequisites
- Node.js 18+ installed
- Toolkit API running (see Method 3 for easy setup)

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**

   Edit `.env.local` and set your values:
   ```env
   TOOLKIT_API_URL=http://localhost:8080
   TOOLKIT_API_KEY=your_actual_api_key
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

✅ Done! You should see the dashboard.

---

## 🐳 Method 2: Docker (Backend + Frontend)

Run both the API and Dashboard with one command!

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Configure docker-compose.yml**

   Edit `docker-compose.yml` and set your values:
   - `API_KEY` (both services)
   - Storage credentials (S3 or GCP)

2. **Start everything**
   ```bash
   docker-compose up -d
   ```

3. **Access the dashboard**

   - Dashboard: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:8080](http://localhost:8080)

4. **View logs**
   ```bash
   # All services
   docker-compose logs -f

   # Just the dashboard
   docker-compose logs -f toolkit-ui

   # Just the API
   docker-compose logs -f toolkit-api
   ```

5. **Stop everything**
   ```bash
   docker-compose down
   ```

✅ Done! Both services are running.

---

## 🔧 Method 3: Manual Setup (API + Frontend)

### Step 1: Start the Toolkit API

If you don't have the API running yet:

```bash
# Clone the API repository
cd /home/user
git clone https://github.com/Davidb-2107/no-code-architects-toolkit.git
cd no-code-architects-toolkit

# Create .env file
cat > .env << EOF
API_KEY=my_secure_api_key_123
S3_ENDPOINT_URL=your_s3_endpoint
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket
S3_REGION=your_region
EOF

# Start with Docker
docker-compose up -d

# Or run locally
pip install -r requirements.txt
python app.py
```

### Step 2: Start the Dashboard

```bash
cd /home/user/no-code-architects-toolkit-ui

# Install dependencies
npm install

# Configure
echo "TOOLKIT_API_URL=http://localhost:8080" > .env.local
echo "TOOLKIT_API_KEY=my_secure_api_key_123" >> .env.local

# Start
npm run dev
```

✅ Done!

---

## 🧪 Testing

### Test the API

```bash
curl -X POST http://localhost:8080/v1/toolkit/test \
  -H "X-API-Key: your_api_key"
```

Expected response:
```json
{
  "code": 200,
  "message": "success",
  "response": {...}
}
```

### Test the Dashboard

1. Open [http://localhost:3000](http://localhost:3000)
2. Go to the "Convert" tab
3. Enter a media URL (e.g., a public MP4 file)
4. Select an output format
5. Click "Convert Media"

---

## 🎯 Quick Feature Test

### Convert a Video

```bash
# Using the API directly
curl -X POST http://localhost:8080/v1/media/convert \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "output_format": "mp3"
  }'
```

Or use the dashboard at [http://localhost:3000](http://localhost:3000)

### Transcribe Audio

Use the "Transcribe" tab in the dashboard to transcribe any audio/video file.

---

## 🔍 Troubleshooting

### Dashboard shows "Server configuration error"

**Problem:** Missing environment variables

**Solution:**
```bash
# Check .env.local exists
ls -la .env.local

# Verify contents
cat .env.local

# Should show:
# TOOLKIT_API_URL=http://localhost:8080
# TOOLKIT_API_KEY=your_api_key
```

### "Connection refused" or "Network error"

**Problem:** API not running or wrong URL

**Solution:**
```bash
# Check API is running
curl http://localhost:8080/v1/toolkit/test \
  -H "X-API-Key: your_api_key"

# If fails, start the API
cd ../no-code-architects-toolkit
docker-compose up -d
```

### Module not found errors

**Problem:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Explore Features**
   - Try different conversion formats
   - Test transcription with different Whisper models
   - Check the response times

2. **Customize**
   - Edit `app/page.tsx` to change the layout
   - Modify `tailwind.config.ts` for custom styling
   - Add new endpoints in `app/api/toolkit/`

3. **Deploy**
   - See README.md for Vercel deployment
   - Use Docker for self-hosted deployment
   - Configure production environment variables

---

## 🆘 Need Help?

- **Documentation:** See [README.md](README.md)
- **API Docs:** [Toolkit API Documentation](https://github.com/Davidb-2107/no-code-architects-toolkit/tree/main/docs)
- **Community:** [Skool Community](https://skool.com/no-code-architects)
- **Issues:** [GitHub Issues](https://github.com/Davidb-2107/no-code-architects-toolkit/issues)

---

## ✅ Verification Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] .env.local configured with correct values
- [ ] Toolkit API running and accessible
- [ ] Dashboard starts without errors (`npm run dev`)
- [ ] Can access [http://localhost:3000](http://localhost:3000)
- [ ] API test endpoint works
- [ ] Can convert a test file
- [ ] Can transcribe a test file

Once all checked, you're ready to go! 🎉
