import { NextRequest, NextResponse } from 'next/server';

interface FallbackAnalyticsEvent {
  event_type: string;
  timestamp: number;
  session_id: string;
  user_id?: string;
  playback_id: string;
  metadata?: Record<string, any>;
  custom_data?: Record<string, any>;
}

interface FallbackAnalyticsPayload {
  events: FallbackAnalyticsEvent[];
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: FallbackAnalyticsPayload = await request.json();
    
    // Log events for now - you can store in database or forward to other analytics services
    console.log('📊 Fallback Analytics Events:', {
      source: data.source,
      event_count: data.events.length,
      events: data.events.map(event => ({
        type: event.event_type,
        timestamp: new Date(event.timestamp).toISOString(),
        session: event.session_id,
        user: event.user_id,
        playback_id: event.playback_id,
        metadata: event.metadata
      }))
    });

    // Here you could:
    // 1. Store events in your database
    // 2. Forward to other analytics services
    // 3. Send to your own data warehouse
    // 4. Process for real-time dashboards

    // Example: Store critical events
    for (const event of data.events) {
      if (['play_initiated', 'stream_health_summary'].includes(event.event_type)) {
        // Store important events in database
        console.log(`🔥 Critical event: ${event.event_type}`, event.custom_data);
      }
    }

    return NextResponse.json({ 
      received: true, 
      processed: data.events.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fallback analytics processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'Fallback analytics endpoint active',
    timestamp: new Date().toISOString()
  });
}