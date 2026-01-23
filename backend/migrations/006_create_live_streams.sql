CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) UNIQUE,
    mux_live_stream_id VARCHAR(255) NOT NULL,
    mux_playback_id VARCHAR(255),
    stream_key VARCHAR(255) NOT NULL,
    rtmp_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'idle', -- idle, active, disconnected
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_streams_event ON live_streams(event_id);
