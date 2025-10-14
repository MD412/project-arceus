# Render Deployment Guide - Project Arceus Worker

**Last Updated:** October 11, 2025  
**Status:** Ready for deployment  
**Estimated Setup Time:** 20-30 minutes

---

## 📋 Overview

This guide covers deploying the Pokemon Card worker to [Render](https://render.com), a Platform-as-a-Service (PaaS) that provides:
- Docker-based deployments
- Automatic scaling
- Built-in monitoring & logs
- GitHub integration for auto-deploy
- Free tier available for testing

---

## ✅ Prerequisites

Before deploying, ensure you have:

1. **Render Account**
   - Sign up at https://render.com (free tier available)
   - Connect your GitHub account

2. **Supabase Credentials**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
   - Find these in: Supabase Dashboard → Settings → API

3. **Repository Access**
   - Push access to your GitHub repository
   - Files committed: `Dockerfile`, `render.yaml`, `.dockerignore`

4. **YOLO Model File**
   - `worker/pokemon_cards_trained.pt` must be in repository
   - Should be ~10-50 MB in size

---

## 🚀 Deployment Steps

### Step 1: Prepare Repository

Ensure these files are committed and pushed:

```bash
# Verify files exist
ls -l Dockerfile render.yaml .dockerignore
ls -l worker/pokemon_cards_trained.pt

# Commit deployment configuration
git add Dockerfile render.yaml .dockerignore worker/requirements.txt
git commit -m "feat: add Render deployment configuration"
git push origin main
```

### Step 2: Connect to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Select **"Connect a repository"**
4. Choose your GitHub repository (`project-arceus`)
5. Render will detect `render.yaml` automatically

### Step 3: Configure Environment Variables

In the Render Dashboard:

1. Navigate to your worker service: **arceus-worker**
2. Click **"Environment"** tab
3. Add the following environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)

# Optional (already set in render.yaml)
PYTHON_VERSION=3.11
PYTHONUNBUFFERED=1
LOG_LEVEL=INFO
```

⚠️ **IMPORTANT:** Keep `SUPABASE_SERVICE_ROLE_KEY` secret! Never commit it to git.

### Step 4: Deploy

1. Click **"Create Blueprint Instance"** or **"Deploy"**
2. Render will:
   - Clone your repository
   - Build Docker image (5-10 minutes first time)
   - Start the worker
3. Monitor progress in **Logs** tab

### Step 5: Verify Deployment

Check the logs for successful startup:

```
[OK] Logger initialized
[OK] Environment loaded
[..] Loading YOLO model
[OK] YOLO model loaded from pokemon_cards_trained.pt
[..] Connecting to Supabase
[OK] Supabase connected
[..] Initializing CLIP identifier
[OK] CLIP identifier initialized
[OK] Worker initialized successfully, starting main loop...
```

### Step 6: Test with a Scan

1. Upload a scan via your Next.js app at `/scan-upload`
2. Watch Render logs for processing:
   ```
   [OK] Job dequeued: <job_id>
   [..] Downloading image
   [OK] Image downloaded
   [..] Detecting cards (YOLO)
   [OK] Detection complete: 10 cards found
   [..] Identifying cards (CLIP)
   [OK] Identifications complete
   [..] Uploading results + writing DB
   [OK] Results uploaded
   [COMPLETE] Job <job_id> completed successfully
   ```

3. Check your database for results:
   ```sql
   SELECT * FROM card_detections ORDER BY created_at DESC LIMIT 10;
   SELECT * FROM user_cards ORDER BY added_at DESC LIMIT 10;
   ```

---

## 💰 Pricing & Plans

### Starter Plan ($7/month) ⚠️ May be too small
- 512 MB RAM
- 0.5 CPU
- **Risk:** ML models may cause OOM (Out of Memory) errors

### Standard Plan ($25/month) ✅ Recommended
- 2 GB RAM
- 1 CPU
- **Sweet spot** for single-worker ML deployment

### Pro Plan ($85/month)
- 4 GB RAM
- 2 CPU
- For high-volume production use

**Free Tier:**
- 750 hours/month free compute credit
- Good for testing, but may be slow for ML workloads

**Recommendation:** Start with **Standard plan** ($25/month) for reliable performance.

---

## 📊 Resource Usage Estimates

Based on worker code review:

| Operation | CPU | RAM | Duration |
|-----------|-----|-----|----------|
| Startup (load models) | High | ~1.5 GB | 30-60s |
| Idle (polling) | Low | ~1.5 GB | Continuous |
| Processing job | High | ~2 GB | 10-30s per scan |

**Bottlenecks:**
- YOLO model: ~100 MB RAM
- CLIP model: ~500 MB RAM
- PyTorch framework: ~800 MB RAM
- Buffer for image processing: ~500 MB RAM

**Total:** ~2 GB RAM recommended minimum

---

## 🔧 Configuration Options

### Environment Variables

Available in `render.yaml` or Render Dashboard:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | - | Service role key (secret) |
| `PYTHON_VERSION` | No | 3.11 | Python version |
| `PYTHONUNBUFFERED` | No | 1 | Disable output buffering |
| `LOG_LEVEL` | No | INFO | Logging verbosity |

### Scaling Options

**Vertical Scaling:**
- Upgrade plan for more RAM/CPU
- Settings → Change Plan

**Horizontal Scaling:**
- Render Pro plan supports multiple instances
- Enable in Settings → Scaling
- ⚠️ Requires idempotency (currently implemented via `visibility_timeout_at`)

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# In Render Dashboard
Navigate to: arceus-worker → Logs

# Filter logs
- Click "Log Level" → Select INFO, WARN, ERROR
- Search for "[ERROR]" or "[OK]" markers
```

### Common Issues

#### Issue: "Out of Memory (OOM)"
```
Symptom: Worker crashes with exit code 137
Solution: Upgrade to Standard plan (2 GB RAM)
```

#### Issue: "Model file not found"
```
Symptom: [ERROR] Trained model not found at: pokemon_cards_trained.pt
Solution: Verify file is committed and pushed to git
```

#### Issue: "Missing env vars"
```
Symptom: [ERROR] Missing env vars: NEXT_PUBLIC_SUPABASE_URL
Solution: Set environment variables in Render Dashboard
```

#### Issue: "No jobs found"
```
Symptom: Worker polls but never processes jobs
Solution: Check Supabase job_queue table has pending jobs
```

### Health Checks

Monitor worker health via logs:

```bash
# Startup health (should appear once on boot)
[OK] Logger initialized
[OK] Environment loaded
[OK] YOLO model loaded
[OK] Supabase connected
[OK] CLIP identifier initialized
[OK] Worker initialized successfully

# Processing health (repeating pattern)
[OK] Job dequeued
[OK] Detection complete
[OK] Identifications complete
[OK] Results uploaded
[COMPLETE] Job completed successfully
```

### Performance Metrics

Track these in logs:

```python
[STATS] Created 8 user cards from 10 detections
```

Expected metrics:
- **Detection accuracy:** 90-95% of cards found
- **Identification success:** 95-99% matched to card_embeddings
- **user_cards creation:** 80-95% (depends on embedding coverage)
- **Processing time:** 10-30 seconds per scan

---

## 🔄 Auto-Deploy Setup

### Current Configuration

```yaml
autoDeploy: true  # In render.yaml
```

**Behavior:**
- Push to `main` → Automatic deployment
- Render rebuilds Docker image
- Zero-downtime deployment (new container replaces old)

### Disable Auto-Deploy (Optional)

In Render Dashboard:
1. Navigate to: arceus-worker → Settings
2. Under "Auto-Deploy"
3. Toggle **OFF** to require manual deploys

### Manual Deploy

```bash
# In Render Dashboard
Click: Manual Deploy → Deploy latest commit
```

---

## 🔐 Security Best Practices

1. **Never commit secrets**
   ```bash
   # ❌ BAD - Don't do this
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... 
   
   # ✅ GOOD - Set in Render Dashboard
   ```

2. **Use service role key wisely**
   - Only grant necessary permissions in Supabase RLS policies
   - Consider creating a dedicated "worker" role with limited permissions

3. **Monitor logs for sensitive data**
   - Code already sanitizes keys in logs
   - Double-check no user data is logged

4. **Rotate keys periodically**
   - Regenerate service role key every 6-12 months
   - Update in Render Dashboard

---

## 📈 Optimization Tips

### Faster Deployments

```dockerfile
# Dockerfile already uses multi-stage build
# This caches dependency layer separately from code
# Result: Faster rebuilds when only code changes
```

### Reduce Cold Start Time

Currently ~30-60s to load models. To optimize:

1. **Use model quantization** (future improvement)
   ```python
   # Reduce model size by 4x with minimal accuracy loss
   model = torch.quantization.quantize_dynamic(model)
   ```

2. **Cache models in Docker layer**
   ```dockerfile
   # Already implemented in Dockerfile
   COPY worker/pokemon_cards_trained.pt ./pokemon_cards_trained.pt
   ```

### Reduce RAM Usage

Current usage: ~2 GB. To optimize:

1. **Use smaller CLIP model** (future improvement)
   ```python
   # Current: open-clip ViT-B/32 (~500 MB)
   # Option: ViT-B/16 smaller variant (~250 MB)
   ```

2. **Lazy load models** (not recommended for worker)
   - Increases first job latency
   - Better to keep models in memory

---

## 🧪 Testing Deployment

### Local Docker Build (Optional)

Test the Dockerfile locally before deploying:

```bash
# Build image
docker build -t arceus-worker .

# Run container (with env vars)
docker run \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
  arceus-worker

# Expected output:
# [OK] Logger initialized
# [OK] Environment loaded
# ...
```

### Staging Environment (Optional)

Create a separate Render service for testing:

1. Duplicate `render.yaml` → `render.staging.yaml`
2. Change service name: `arceus-worker-staging`
3. Point to staging Supabase project
4. Deploy separately

---

## 🚨 Rollback Procedure

If deployment fails:

### Option 1: Render Dashboard
1. Navigate to: arceus-worker → Deploy
2. Click "Rollback to previous version"
3. Select last known good deployment

### Option 2: Git Revert
```bash
# Find problematic commit
git log --oneline

# Revert to previous commit
git revert <commit-hash>
git push origin main

# Render will auto-deploy the revert
```

### Option 3: Disable Worker Temporarily
1. In Render Dashboard: arceus-worker → Settings
2. Click "Suspend"
3. Fix issues locally
4. Click "Resume" when ready

---

## 📞 Support & Resources

### Render Documentation
- Blueprints: https://render.com/docs/blueprint-spec
- Docker: https://render.com/docs/docker
- Environment Variables: https://render.com/docs/environment-variables

### Project Documentation
- [Worker Code Review](./working-memory/reports/2025/10-october/worker_code_review_20251011.md)
- [Worker Status Report](../logs/worker_status_20251009.md)
- [System Architecture](../SYSTEM_MAP.md)

### Troubleshooting
- Render Community: https://community.render.com
- Render Status: https://status.render.com

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Worker appears "Live" in Render Dashboard
- [ ] Startup logs show all `[OK]` markers
- [ ] Test scan processes successfully
- [ ] Detections appear in `card_detections` table
- [ ] User cards created in `user_cards` table
- [ ] No errors in Render logs
- [ ] Consider upgrading from Starter to Standard plan if OOM errors
- [ ] Set up monitoring/alerting (Render Pro feature)
- [ ] Document any custom configuration
- [ ] Share Render dashboard access with team (optional)

---

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check logs periodically
   - Verify jobs processing successfully
   - Watch for OOM or crash errors

2. **Performance tuning**
   - If slow: upgrade plan
   - If memory issues: optimize models
   - If high volume: consider horizontal scaling

3. **Set up alerting** (Render Pro only)
   - Email on worker crash
   - Slack integration for errors
   - Uptime monitoring

4. **Cost optimization**
   - Monitor actual usage
   - Adjust plan as needed
   - Consider reserved instances for predictable workloads

---

**Deployment Ready!** 🚀

The worker has been validated in production (38 user_cards created), code review shows 5/5 stars, and all configuration files are in place. You're ready to deploy to Render!

---

**Questions or issues?** Check the troubleshooting section or review worker logs at `logs/worker_status_20251009.md`.




