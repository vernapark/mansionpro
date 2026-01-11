# 🚀 Render.com Deployment Guide

## Prerequisites
- GitHub account
- Render.com account (free tier works)
- Your code pushed to a GitHub repository

## Step 1: Update Configuration

### 1.1 Update `render.yaml`
The `render.yaml` file is already configured. You just need to update:

```yaml
envVars:
  - key: ALLOWED_ORIGINS
    value: https://your-app-name.onrender.com  # Replace with your actual Render URL
```

### 1.2 Update CSP Headers in Production
After deployment, you'll need to update the Content Security Policy to include your Render.com domain.

## Step 2: Deploy to Render.com

### Method 1: Using Render Dashboard (Recommended)

1. **Login to Render.com**
   - Go to https://render.com
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this code

3. **Configure Service**
   - **Name**: `sms-varanasi-payment-system` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave empty (or specify if in subdirectory)
   - **Build Command**: `npm install && cd server && npm install`
   - **Start Command**: `node server/server.js`

4. **Environment Variables** (Critical!)
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://your-app-name.onrender.com
   ```
   
   **After first deployment, update ALLOWED_ORIGINS with your actual URL!**

5. **Advanced Settings**
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes (recommended)

6. **Click "Create Web Service"**

### Method 2: Using render.yaml (Blueprint)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy via Blueprint**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will auto-detect `render.yaml`

## Step 3: Post-Deployment Configuration

### 3.1 Get Your Render URL
After deployment, Render will provide a URL like:
```
https://sms-varanasi-payment-system-xxxx.onrender.com
```

### 3.2 Update Environment Variables
1. Go to your service in Render dashboard
2. Click "Environment" tab
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://sms-varanasi-payment-system-xxxx.onrender.com
   ```
4. Click "Save Changes"
5. Service will auto-redeploy

### 3.3 Update CSP Headers (Important!)
After getting your Render URL, you'll need to update the Content Security Policy in `server.js`:

In the Helmet configuration, add your Render domain to `connectSrc`:
```javascript
connectSrc: [
    "'self'",
    "wss://your-app-name.onrender.com",
    "https://your-app-name.onrender.com",
    // ... other domains
]
```

## Step 4: Database Persistence

### Render's Ephemeral Filesystem
⚠️ **Important**: Render's free tier uses ephemeral storage. Files are lost on restarts!

### Solution Options:

#### Option 1: PostgreSQL (Recommended for Production)
```bash
# Add PostgreSQL to your Render service
# Then update database.js to use PostgreSQL instead of JSON
```

#### Option 2: External Storage
- Use AWS S3 / Google Cloud Storage
- Store database file externally
- Load/save on each operation

#### Option 3: MongoDB Atlas (Easy Setup)
- Free tier available
- Good for this use case
- Update database.js to use MongoDB

#### Option 4: Keep Current Setup (Development Only)
- Data persists between requests
- **Data lost on service restart/redeploy**
- Good for testing only

## Step 5: Testing Your Deployment

### 5.1 Health Check
```bash
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "running",
  "uptime": 123.45,
  "activeConnections": 0,
  "timestamp": "2026-01-11T04:30:00.000Z"
}
```

### 5.2 Test WebSocket Connection
Open your browser console on the deployed site:
```javascript
const socket = io('https://your-app-name.onrender.com');
socket.on('connect', () => console.log('Connected!'));
```

### 5.3 Test Admin Panel
Navigate to:
```
https://your-app-name.onrender.com/parking55009hvSweJimbs5hhinbd56y
```

## Step 6: Custom Domain (Optional)

### Add Custom Domain
1. Go to service settings in Render
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. Update `ALLOWED_ORIGINS` environment variable

## Troubleshooting

### Issue: "Application Error" or 503
**Solution**: Check build logs in Render dashboard
- Ensure all dependencies installed
- Check for missing environment variables

### Issue: WebSocket not connecting
**Solution**: 
1. Verify `wss://` protocol (not `ws://`)
2. Check CORS configuration
3. Ensure `connectSrc` in CSP includes your domain

### Issue: Database not persisting
**Solution**: This is expected on Render free tier
- Upgrade to paid plan for persistent storage
- Or use external database (PostgreSQL, MongoDB)

### Issue: CORS Errors
**Solution**:
1. Verify `ALLOWED_ORIGINS` environment variable
2. Check it includes your exact Render URL
3. Restart service after updating

### Issue: Rate Limiting Too Aggressive
**Solution**: Update environment variables:
```
RATE_LIMIT_AGGRESSIVE=100
RATE_LIMIT_STANDARD=200
```

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Render service created and deployed
- [ ] `ALLOWED_ORIGINS` updated with actual URL
- [ ] Health check endpoint working
- [ ] WebSocket connections working
- [ ] Admin panel accessible
- [ ] Database persistence solution chosen
- [ ] SSL/HTTPS working (automatic on Render)
- [ ] CSP headers updated with production domains
- [ ] Security settings reviewed
- [ ] Monitoring/logging configured

## Monitoring Your Application

### Render Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### Application Logs
Access logs via:
```bash
# Using Render CLI
render logs -s your-service-name

# Or in Render dashboard → Logs tab
```

## Scaling Considerations

### Free Tier Limitations
- Spins down after 15 minutes of inactivity
- First request after spin-down may be slow (cold start)
- Limited CPU/Memory

### Upgrade Options
- **Starter Plan**: Stays always on, no cold starts
- **Standard Plan**: More resources, better performance

## Security Notes

1. **Environment Variables**: Never commit sensitive data to Git
2. **HTTPS**: Automatically enabled by Render
3. **Rate Limiting**: Already configured, adjust as needed
4. **DDoS Protection**: Basic protection enabled

## Support Resources

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- This Project Issues: [Your GitHub Issues URL]

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Monitor logs for errors
3. Set up database persistence if needed
4. Configure custom domain if required
5. Enable monitoring/alerting

---

**Deployment Date**: ________________  
**Render URL**: ________________  
**Custom Domain**: ________________  

---

🎉 **Congratulations!** Your SMS Varanasi Payment System is now live on Render.com!
