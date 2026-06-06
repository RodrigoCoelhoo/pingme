package com.pingme.shared.metrics;

import com.pingme.shared.presence.PresenceTracker;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import static com.pingme.shared.metrics.MetricsConstants.*;

@Component
public class WebsocketMetrics {

    private final MeterRegistry registry;
    private final Counter connectionsOpened;
    private final Counter connectionsClosed;

    public WebsocketMetrics(MeterRegistry registry, PresenceTracker presenceTracker) {
        this.registry = registry;

        Gauge.builder(ONLINE_USERS, presenceTracker, PresenceTracker::getOnlineUserCount)
                .description("Current online users")
                .register(registry);

        Gauge.builder(WEBSOCKET_SESSIONS, presenceTracker, PresenceTracker::getSessionCount)
                .description("Active WebSocket sessions")
                .register(registry);

        this.connectionsOpened = Counter.builder(WS_CONNECTIONS_OPENED)
                .description("WebSocket connections opened")
                .register(registry);

        this.connectionsClosed = Counter.builder(WS_CONNECTIONS_CLOSED)
                .description("WebSocket connections closed")
                .register(registry);

        // Pre-register error series so they appear in Prometheus before the first error
        registry.counter(WS_ERRORS, TAG_REASON, "delivery_failed");
        registry.counter(WS_ERRORS, TAG_REASON, "unknown");
    }

    public void connectionOpened() {
        connectionsOpened.increment();
    }

    public void connectionClosed() {
        connectionsClosed.increment();
    }

    public void recordError(String reason) {
        registry.counter(WS_ERRORS, TAG_REASON, reason).increment();
    }
}