import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Webhook signature verification for Mux
function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('mux-signature') || '';
    const rawBody = await request.text();
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    
    // Handle different Mux Data events
    switch (event.type) {
      case 'video.live_stream.active':
        console.log('🔴 Live stream started:', {
          stream_id: event.data.id,
          playback_id: event.data.playback_ids?.[0]?.id,
          timestamp: new Date().toISOString()
        });
        break;

      case 'video.live_stream.idle':
        console.log('⚫ Live stream ended:', {
          stream_id: event.data.id,
          duration: event.data.duration,
          timestamp: new Date().toISOString()
        });
        break;

      case 'video.live_stream.recording':
        console.log('📹 Live stream recording created:', {
          stream_id: event.data.id,
          asset_id: event.data.recent_asset_ids?.[0],
          timestamp: new Date().toISOString()
        });
        break;

      case 'video.view.end':
        // Log detailed view analytics
        console.log('👁️ View session ended:', {
          view_id: event.data.id,
          session_id: event.data.session_id,
          watch_time: event.data.watch_time,
          total_rebuffering_duration: event.data.total_rebuffering_duration,
          exit_before_video_start: event.data.exit_before_video_start,
          viewer_user_id: event.data.viewer_user_id,
          custom_1: event.data.custom_1, // Stream type
          custom_2: event.data.custom_2, // Device type
          custom_6: event.data.custom_6, // Auth status
          custom_7: event.data.custom_7, // User role
          timestamp: new Date().toISOString()
        });
        break;

      default:
        console.log('Received Mux webhook:', event.type);
    }

    // Store critical analytics data in your database here if needed
    // Example: await storeAnalyticsEvent(event);

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook validation
export async function GET() {
  return NextResponse.json({ 
    status: 'Mux webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}