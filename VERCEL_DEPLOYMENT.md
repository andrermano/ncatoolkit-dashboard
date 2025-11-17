# Deploying to Vercel

Complete guide to deploy your No-Code Architects Toolkit Dashboard to Vercel.

## 🚀 Quick Deploy (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works great)
- Your Toolkit API running somewhere accessible

### Step 1: Push to GitHub

```bash
cd /home/user/no-code-architects-toolkit-ui

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Toolkit Dashboard"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/toolkit-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Go to [Vercel](https://vercel.com)** and sign in with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select "toolkit-dashboard" (or whatever you named it)
   - Click "Import"

4. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

5. **Add Environment Variables** (IMPORTANT!)

   Click "Environment Variables" and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `TOOLKIT_API_URL` | Your API URL (e.g., `https://your-api.com`) | Production, Preview, Development |
   | `TOOLKIT_API_KEY` | Your API key | Production, Preview, Development |

   ⚠️ **IMPORTANT:**
   - Use `https://` for production APIs
   - Make sure your API is publicly accessible (or use Vercel's private networking)
   - Never commit `.env.local` to Git!

6. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build
   - Your dashboard will be live at `https://your-project.vercel.app`

✅ Done! Your dashboard is live!

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. SSL is automatic!

### Environment Variables for Different Environments

You might want different APIs for different environments:

**Production:**
```
TOOLKIT_API_URL=https://api.production.com
TOOLKIT_API_KEY=prod_key_123
```

**Preview (staging):**
```
TOOLKIT_API_URL=https://api.staging.com
TOOLKIT_API_KEY=staging_key_456
```

**Development:**
```
TOOLKIT_API_URL=http://localhost:8080
TOOLKIT_API_KEY=dev_key_789
```

### Automatic Deployments

Vercel automatically deploys:
- **Production:** When you push to `main` branch
- **Preview:** When you push to any other branch or open a PR

---

## 🛡️ Security Best Practices

### 1. Protect Your API Key

✅ **DO:**
- Store API key in Vercel environment variables
- Use different keys for production/staging
- Rotate keys regularly

❌ **DON'T:**
- Commit `.env.local` to Git
- Share API keys in public repos
- Use the same key for dev and prod

### 2. API Access

If your Toolkit API is private:

**Option A: Make it public** (easiest)
- Deploy your API to a public URL
- Use firewall rules to restrict access

**Option B: Use Vercel's Edge Network**
- Deploy API on same Vercel account
- Use internal networking

**Option C: VPN/Private Network**
- Requires Vercel Pro/Enterprise
- Connect to private networks

### 3. CORS Configuration

If you get CORS errors, update your Toolkit API to allow Vercel domain:

```python
# In your Toolkit API's config or middleware
ALLOWED_ORIGINS = [
    "https://your-project.vercel.app",
    "https://your-custom-domain.com",
]
```

---

## 📊 Monitoring & Analytics

### Enable Web Analytics

1. Go to your project on Vercel
2. Click "Analytics"
3. Enable "Web Analytics" (free)
4. Track visitors, performance, and more

### Enable Speed Insights

1. Go to "Speed Insights" in your project
2. Enable it
3. Get real-time performance metrics

### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs https://your-project.vercel.app
```

---

## 🔄 CI/CD Workflow

### Automatic Workflow

```
Push to GitHub → Vercel detects change → Build → Deploy → Live
```

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deploy from CLI with environment variables

```bash
# Set environment variables
vercel env add TOOLKIT_API_URL production
# Enter value when prompted

vercel env add TOOLKIT_API_KEY production
# Enter value when prompted

# Deploy
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"

**Solution:**
```bash
# Locally, delete and reinstall
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Environment Variables Not Working

**Problem:** Changes to env vars not reflected

**Solution:**
1. Update env vars in Vercel dashboard
2. Go to "Deployments"
3. Click "..." on latest deployment
4. Click "Redeploy"
5. Check "Use existing Build Cache" (or uncheck to force fresh build)

### API Connection Fails

**Problem:** "Server configuration error" or "Network error"

**Solution:**
1. Check environment variables are set correctly
2. Verify `TOOLKIT_API_URL` is publicly accessible
3. Test API directly:
   ```bash
   curl https://your-api.com/v1/toolkit/test \
     -H "X-API-Key: your_key"
   ```
4. Check Vercel function logs for detailed errors

### CORS Errors

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
This shouldn't happen because you're using Next.js API routes (server-side proxy). If it does:

1. Make sure you're calling `/api/toolkit/*` endpoints (not the Toolkit API directly)
2. Check that API routes are working:
   ```bash
   curl https://your-project.vercel.app/api/toolkit/convert \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"url":"https://test.com/file.mp4","output_format":"mp3"}'
   ```

### Timeout Errors

**Problem:** "Function execution timeout"

**Issue:** Vercel free tier has 10s timeout for serverless functions

**Solutions:**
1. **Use webhooks** (best for long tasks):
   - Modify API requests to include `webhook_url`
   - Toolkit API will process async and call webhook when done

2. **Upgrade to Pro** ($20/month):
   - 60s timeout on Hobby
   - 300s timeout on Pro

3. **Use streaming responses** (for real-time updates)

---

## 💰 Pricing Considerations

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Web Analytics
- ⚠️ 10s serverless function timeout

### When to Upgrade to Pro ($20/month):
- Need 60s function timeout
- Need more bandwidth (1TB)
- Want custom domains without "vercel.app"
- Need password protection
- Want advanced analytics

### Cost Optimization Tips:
1. **Use webhooks** for long-running tasks (avoid timeouts)
2. **Cache responses** where possible
3. **Optimize images** (use Next.js Image component)
4. **Monitor bandwidth** in Vercel dashboard

---

## 🧪 Testing Before Production

### Preview Deployments

Every git branch gets a preview URL:

```bash
# Create a test branch
git checkout -b test-feature

# Make changes
# ...

# Push
git push origin test-feature
```

Vercel automatically creates a preview at:
`https://your-project-git-test-feature-yourname.vercel.app`

### Local Testing with Production Build

```bash
# Build production version
npm run build

# Start production server locally
npm start

# Test at http://localhost:3000
```

---

## 📈 Performance Optimization

### Enable Next.js Optimizations

Already configured in the project:
- ✅ Static page generation
- ✅ API route optimization
- ✅ Automatic code splitting
- ✅ Image optimization (when used)

### Add Caching Headers

Create `next.config.ts` modifications if needed:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/api/toolkit/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};
```

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Next.js on Vercel:** https://vercel.com/docs/frameworks/nextjs
- **Environment Variables:** https://vercel.com/docs/environment-variables
- **Vercel CLI:** https://vercel.com/docs/cli

---

## ✅ Pre-Deployment Checklist

Before deploying, make sure:

- [ ] Code is pushed to GitHub
- [ ] `.env.local` is in `.gitignore` (it is!)
- [ ] Toolkit API is accessible from internet
- [ ] You have your API key ready
- [ ] You've tested locally with production build (`npm run build && npm start`)
- [ ] You have a Vercel account
- [ ] You know your TOOLKIT_API_URL (must be HTTPS in production)

---

## 🎉 Post-Deployment

After deploying:

1. **Test all features:**
   - Media conversion
   - Transcription
   - Error handling

2. **Monitor:**
   - Check Vercel Analytics
   - Watch for errors in Vercel logs
   - Monitor API usage

3. **Share:**
   - Share your dashboard URL
   - Document for your team
   - Set up monitoring/alerts

---

## 🆘 Need Help?

- **Vercel Support:** https://vercel.com/support
- **Community:** https://github.com/vercel/next.js/discussions
- **Toolkit API Issues:** https://github.com/Davidb-2107/no-code-architects-toolkit/issues

---

Good luck with your deployment! 🚀
