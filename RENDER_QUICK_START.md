# 🚀 Quick Start: Deploy to Render.com in 5 Minutes

## Before You Start
- [ ] Code pushed to GitHub
- [ ] Render.com account created (free)
- [ ] GitHub connected to Render.com

## Step 1: Create Web Service (2 minutes)

1. **Login to Render.com**
   - Visit: https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: sms-varanasi-payment
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install && cd server && npm install
   Start Command: node server/server.js
   ```

4. **Click "Create Web Service"**

## Step 2: Add Environment Variables (2 minutes)

In Render dashboard, go to "Environment" tab and add:

```env
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://sms-varanasi-payment.onrender.com
DB_PATH=/tmp/payments.json
```

**⚠️ IMPORTANT**: Replace `sms-varanasi-payment.onrender.com` with YOUR actual Render URL!

## Step 3: Wait for Deployment (1 minute)

- Watch the build logs
- Wait for "Your service is live 🎉"
- Copy your Render URL

## Step 4: Update ALLOWED_ORIGINS (30 seconds)

1. Go back to "Environment" tab
2. Update `ALLOWED_ORIGINS` with your ACTUAL URL
3. Click "Save Changes"
4. Wait for automatic redeploy

## Step 5: Test Your Deployment (30 seconds)

Open your Render URL and verify:
- [ ] Website loads
- [ ] No CORS errors in console
- [ ] Admin panel accessible: `https://your-url.onrender.com/parking55009hvSweJimbs5hhinbd56y`

## Done! 🎉

Your payment system is now live on Render.com!

## Common Issues & Quick Fixes

### Issue: "Application Error"
**Fix**: Check logs in Render dashboard for specific error

### Issue: CORS Errors
**Fix**: Double-check `ALLOWED_ORIGINS` matches your exact Render URL

### Issue: WebSocket not connecting
**Fix**: Make sure you're using `https://` (not `http://`)

### Issue: Database not persisting
**Expected**: Free tier uses ephemeral storage - data resets on restart
**Solution**: Upgrade to paid tier or use external database

## Need Help?

- See full guide: `RENDER_DEPLOYMENT_GUIDE.md`
- Check Render docs: https://render.com/docs
- View logs: Render Dashboard → Logs tab

---

**Total Time**: ~5 minutes
**Cost**: FREE (with limitations)
**Status**: ✅ Production Ready
