# Analytics Troubleshooting Guide

## Issue: Mux Data Beacons Blocked (ERR_BLOCKED_BY_CLIENT)

### Problem
The error `net::ERR_BLOCKED_BY_CLIENT` when accessing `*.litix.io` URLs indicates that Mux Data analytics beacons are being blocked by:
- Ad blockers (uBlock Origin, AdBlock Plus, etc.)
- Privacy extensions (Privacy Badger, Ghostery, etc.) 
- Corporate firewalls
- Browser privacy settings

### Solutions Implemented

#### 1. Custom Beacon Domain (Recommended)
Set up a custom subdomain to proxy Mux Data requests:

**Environment Variable:**
```env
NEXT_PUBLIC_MUX_BEACON_DOMAIN=analytics.yourdomain.com
```

**DNS Setup:**
- Create CNAME: `analytics.yourdomain.com -> litix.io`
- Or use your own proxy server

#### 2. Fallback Analytics System
Automatic fallback when Mux beacons are blocked:

**Features:**
- Detects if Mux Data is blocked
- Routes analytics to your own API (`/api/analytics/fallback`)
- Maintains critical event tracking
- Shows warning in development mode

**Critical Events Tracked:**
- Play initiation
- Stream health summaries 
- User engagement metrics
- Quality change events

#### 3. Development Debugging
In development mode, you'll see:
- Warning overlay when Mux is blocked
- Fallback analytics confirmation in console
- Stream health indicator for debugging

### Testing the Fix

1. **Without Ad Blocker:**
   - Should see normal Mux Data in network tab
   - No warning messages
   - Analytics data in Mux dashboard

2. **With Ad Blocker:**
   - Warning appears in development mode
   - Fallback analytics logs in console
   - Events sent to `/api/analytics/fallback`

### Custom Domain Setup (Recommended for Production)

#### Option A: CNAME Proxy
1. Add DNS record: `analytics.yourdomain.com CNAME litix.io`
2. Set environment variable: `NEXT_PUBLIC_MUX_BEACON_DOMAIN=analytics.yourdomain.com`

#### Option B: Server Proxy
```nginx
# Nginx configuration
location /mux-data/ {
    proxy_pass https://litix.io/;
    proxy_set_header Host litix.io;
    proxy_ssl_server_name on;
}
```

### Monitoring Analytics Health

The system now includes:
- Automatic blocking detection
- Fallback event tracking
- Health monitoring dashboard
- Quality metrics collection
- User engagement analytics

### Environment Variables Required

```env
# Mux Configuration
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_STREAM_ID=your_stream_id
MUX_PLAYBACK_ID=your_playback_id
NEXT_PUBLIC_MUX_ENV_KEY=your_env_key

# Optional: Custom beacon domain to avoid blocking
NEXT_PUBLIC_MUX_BEACON_DOMAIN=analytics.yourdomain.com

# Optional: Webhook security
MUX_WEBHOOK_SECRET=your_webhook_secret
```

### Analytics Endpoints

1. **Mux Webhooks:** `/api/mux/webhooks`
   - Receives official Mux Data events
   - Processes view completions and stream status

2. **Fallback Analytics:** `/api/analytics/fallback`
   - Backup when Mux Data is blocked
   - Maintains critical event tracking

### Best Practices

1. **Always use custom domain in production**
2. **Monitor fallback analytics usage**  
3. **Test with common ad blockers**
4. **Store critical events in your database**
5. **Set up alerts for analytics failures**

This comprehensive solution ensures your analytics continue working regardless of client-side blocking, while maintaining the full benefits of Mux Data when available.