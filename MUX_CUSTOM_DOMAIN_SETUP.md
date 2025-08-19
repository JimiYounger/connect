# Mux Data Custom Beacon Domain Setup

## Problem: Ad Blockers Blocking Mux Analytics

The error `net::ERR_BLOCKED_BY_CLIENT` occurs when ad blockers or privacy extensions block Mux Data analytics beacons to `litix.io`. This prevents valuable analytics data from being collected.

## Solution: Custom Beacon Collection Domain

Use your own domain to collect Mux Data analytics, bypassing ad blocker restrictions.

## Step 1: DNS Configuration

### Option A: Automatic Mux-Managed Domain (Recommended)

Contact Mux Support to set up a custom domain. They will provide you with CNAME records:

```dns
# Example records Mux will provide:
analytics.yourdomain.com 300 IN CNAME abc123.customdomains.litix.io
_acme-challenge.analytics.yourdomain.com 300 IN CNAME abc123.validations.customdomains.litix.io
```

**Benefits:**
- Automatic SSL certificate management by Mux
- Guaranteed compatibility and updates
- Full support from Mux team

### Option B: Self-Managed CNAME (Advanced)

Create a CNAME record pointing to Mux's collection domain:

```dns
# DNS Configuration
analytics.yourdomain.com CNAME litix.io
```

**Considerations:**
- You must manage SSL certificates
- Potential for more complex troubleshooting
- Requires more technical expertise

## Step 2: Environment Configuration

Add your custom domain to your environment variables:

```env
# .env.local or .env.production
NEXT_PUBLIC_MUX_BEACON_DOMAIN=analytics.yourdomain.com
```

## Step 3: Application Configuration

The application is already configured to use the custom domain when available. The implementation includes:

### Mux Player Configuration
```typescript
const playerMetadata = {
  ...baseMetadata,
  // Custom beacon domain prevents ad blocker issues
  beacon_collection_domain: process.env.NEXT_PUBLIC_MUX_BEACON_DOMAIN,
  // Privacy compliance
  disable_cookies: true
};
```

### Fallback Analytics System
The app automatically detects when Mux Data is blocked and provides fallback analytics to ensure no data loss.

## Step 4: Testing the Setup

### 1. Test Without Ad Blocker
- Open browser with ad blockers disabled
- Visit your live stream page
- Check Network tab for requests to your custom domain
- Verify analytics appear in Mux Dashboard

### 2. Test With Ad Blocker
- Enable uBlock Origin or similar ad blocker
- Visit your live stream page
- Should see requests to your custom domain (not blocked)
- Verify analytics still appear in Mux Dashboard

### 3. Verify Custom Domain
```bash
# Test that your custom domain is working
curl https://analytics.yourdomain.com -s -w "%{http_code}"
# Should return 200
```

## Step 5: Production Deployment

1. **Configure DNS** with your domain provider
2. **Set environment variable** in production
3. **Deploy application** with new configuration
4. **Monitor analytics** in Mux Dashboard
5. **Verify ad blocker bypass** with testing tools

## Expected Results

### Before Custom Domain
```
❌ POST https://net55eo6tfdok09aramigksh4.litix.io/ net::ERR_BLOCKED_BY_CLIENT
```

### After Custom Domain
```
✅ POST https://analytics.yourdomain.com/ 200 OK
```

## Monitoring and Maintenance

### 1. Analytics Health Check
The application includes:
- Automatic blocking detection
- Fallback analytics when blocked
- Debug warnings in development mode
- Health monitoring dashboard

### 2. DNS Monitoring
- Monitor CNAME record resolution
- Check SSL certificate validity (if self-managed)
- Verify uptime of custom domain

### 3. Mux Dashboard Monitoring
- Confirm analytics data flow
- Check for data gaps or anomalies
- Monitor custom dimension population

## Troubleshooting

### Common Issues

1. **CNAME Not Resolving**
   ```bash
   # Check DNS propagation
   nslookup analytics.yourdomain.com
   dig analytics.yourdomain.com CNAME
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check SSL certificate
   openssl s_client -connect analytics.yourdomain.com:443
   ```

3. **Still Getting Blocked**
   - Verify environment variable is set correctly
   - Check network requests in browser dev tools
   - Confirm fallback analytics are working

### Debug Mode

In development mode, the application shows:
- Warning when Mux Data is blocked
- Current beacon domain being used
- Fallback analytics status
- Stream health indicators

## Benefits of This Solution

✅ **Bypasses Ad Blockers**: Uses your own domain instead of blocked analytics domains  
✅ **No Data Loss**: Maintains full analytics even when primary Mux Data is blocked  
✅ **Privacy Compliant**: Disables cookies and respects user privacy settings  
✅ **Production Ready**: Includes monitoring, fallback, and error handling  
✅ **Easy Testing**: Clear indicators for development and debugging  

## Next Steps

1. Contact Mux Support for custom domain setup (Option A)
2. Or configure your own CNAME (Option B)
3. Set the environment variable
4. Deploy and test both scenarios
5. Monitor analytics dashboard for data flow

This solution ensures your live stream analytics continue working regardless of client-side blocking, providing comprehensive data for your Riverside + Mux integration.