# Railway Deployment Guide

## Environment Variables Required on Railway

You need to set these environment variables in your Railway project dashboard:

### Database Configuration
```
DB_HOST=<your_railway_mysql_host>
DB_USER=<your_railway_mysql_user>
DB_PASSWORD=<your_railway_mysql_password>
DB_NAME=verified_db
```

### Server Configuration
```
PORT=3001
BACKEND_PORT=3001
NODE_ENV=production
```

### Blockchain Configuration
```
BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-
CONTRACT_ADDRESS=0xdb33974fcf60a843cf1dc3003811bb72158974c4
NETWORK_ID=80002
```

### Pinata IPFS Configuration
```
PINATA_GATEWAY_URL=https://amethyst-tropical-jackal-879.mypinata.cloud
```

## How to Set Environment Variables on Railway

1. Go to your Railway project dashboard
2. Select your backend service
3. Click on "Variables" tab
4. Add each environment variable above
5. Click "Deploy" to restart with new variables

## Deployment Checklist

### Backend (Railway) ✓
- [x] `.npmrc` created (skips optional dependencies)
- [x] `nixpacks.toml` created (custom install command)
- [x] `railway.toml` updated (correct start command)
- [x] CORS configured for Netlify URL
- [x] Environment variables set in Railway dashboard
- [x] Repository pushed to GitHub
- [x] Railway connected to GitHub repo

### Frontend (Netlify) ✓
- [x] All API services updated to point to Railway URL
- [x] Build command: `npm run build`
- [x] Publish directory: `build`
- [x] Repository pushed to GitHub
- [x] Netlify connected to GitHub repo

## Testing After Deployment

1. **Backend Health Check**: Visit `https://verified-production.up.railway.app/api/test` (if you have a test endpoint)
2. **Frontend**: Visit `https://verifi-ed.netlify.app`
3. **CORS Test**: Open browser console on Netlify site and check for CORS errors
4. **Database Connection**: Try logging in or fetching data to verify DB connection

## Common Issues

### Issue: CORS Errors
**Solution**: Verify Netlify URL is in `allowedOrigins` array in `server.js`

### Issue: API 404 Errors
**Solution**: Check that Railway is running with correct start command: `node server.js`

### Issue: Database Connection Failed
**Solution**: Verify database environment variables are set correctly in Railway

### Issue: fsevents Build Error
**Solution**: Ensure `.npmrc` and `nixpacks.toml` are committed to repository

## Current Configuration

- **Backend URL**: https://verified-production.up.railway.app
- **Frontend URL**: https://verifi-ed.netlify.app
- **Database**: Railway MySQL (configure in environment variables)
- **Blockchain**: Polygon Amoy Testnet
- **IPFS**: Pinata Gateway
