# Render Quick Start - 5 Minute Deploy

**For:** First-time Render deployment  
**Time:** 5-10 minutes (+ 5-10 min build time)

---

## 🚀 Fast Track Deployment

### 1. Push Files (30 seconds)

```bash
# Verify files exist
git status

# Should see:
# - Dockerfile
# - render.yaml
# - .dockerignore
# - worker/requirements.txt (updated)

# Commit and push
git add Dockerfile render.yaml .dockerignore worker/requirements.txt docs/RENDER_*.md
git commit -m "feat: add Render deployment configuration"
git push origin main
```

### 2. Connect Render (2 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub → Select `project-arceus`
4. Render detects `render.yaml` → Click **"Apply"**

### 3. Set Environment Variables (2 minutes)

In Render Dashboard → `arceus-worker` → Environment:

```bash
# Copy from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Click **"Save Changes"**

### 4. Deploy (5-10 minutes)

Render auto-deploys. Watch logs for:

```
[OK] Logger initialized
[OK] Environment loaded
[OK] YOLO model loaded
[OK] Supabase connected
[OK] CLIP identifier initialized
[OK] Worker initialized successfully, starting main loop...
```

### 5. Test (1 minute)

1. Upload scan via your app (`/scan-upload`)
2. Watch Render logs for:
   ```
   [OK] Job dequeued: <job_id>
   [OK] Detection complete: 10 cards found
   [COMPLETE] Job completed successfully
   ```

---

## ✅ Success Checklist

- [ ] Worker shows "Live" in Render
- [ ] Logs show `[OK] Worker initialized`
- [ ] Test scan processes successfully
- [ ] Cards appear in database

---

## ⚠️ Common Issues

**OOM (Out of Memory):**
- Symptom: Worker crashes (exit 137)
- Fix: Upgrade to Standard plan ($25/month, 2 GB RAM)

**Missing Env Vars:**
- Symptom: `[ERROR] Missing env vars`
- Fix: Set variables in Render Dashboard → Environment

**Model Not Found:**
- Symptom: `[ERROR] Trained model not found`
- Fix: Verify `worker/pokemon_cards_trained.pt` is committed

---

## 📖 Full Documentation

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for:
- Detailed configuration options
- Monitoring & debugging
- Performance optimization
- Security best practices
- Troubleshooting guide

---

**Ready to deploy!** 🎯




