package com.pingme.shared.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import static com.pingme.shared.metrics.MetricsConstants.*;

@Component
public class MessageMetrics {

    private final MeterRegistry registry;
    private final Timer messageSaveTimer;
    private final Timer wsDeliveryTimer;

    public MessageMetrics(MeterRegistry registry) {
        this.registry = registry;

        this.messageSaveTimer = Timer.builder(LATENCY_MESSAGE_SAVE)
                .description("Time to persist a message to MongoDB")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry);

        this.wsDeliveryTimer = Timer.builder(LATENCY_WS_DELIVERY)
                .description("Time to fan-out a message to all chat members via WebSocket")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry);

        registry.counter(MESSAGES_SENT,     TAG_CHAT_TYPE, "PRIVATE");
        registry.counter(MESSAGES_SENT,     TAG_CHAT_TYPE, "GROUP");
        registry.counter(MESSAGES_FAILURES, TAG_REASON,    "unknown");
        registry.counter(MESSAGES_UPLOADS,  TAG_RESULT, RESULT_SUCCESS, TAG_TYPE, "image");
        registry.counter(MESSAGES_UPLOADS,  TAG_RESULT, RESULT_SUCCESS, TAG_TYPE, "file");
        registry.counter(MESSAGES_UPLOADS,  TAG_RESULT, RESULT_FAILURE, TAG_TYPE, "image");
        registry.counter(MESSAGES_UPLOADS,  TAG_RESULT, RESULT_FAILURE, TAG_TYPE, "file");
    }

    public void recordMessageSent(String chatType) {
        registry.counter(MESSAGES_SENT, TAG_CHAT_TYPE, chatType).increment();
    }

    public void recordMessageFailure(String reason) {
        registry.counter(MESSAGES_FAILURES, TAG_REASON, reason).increment();
    }

    public void recordUpload(String result, String mediaType) {
        registry.counter(MESSAGES_UPLOADS, TAG_RESULT, result, TAG_TYPE, mediaType).increment();
    }

    public Timer messageSaveTimer() {
        return messageSaveTimer;
    }

    public Timer wsDeliveryTimer() {
        return wsDeliveryTimer;
    }

    public Timer uploadTimer(String mediaType) {
        return Timer.builder(LATENCY_UPLOAD)
                .description("Cloudinary upload latency")
                .tag(TAG_TYPE, mediaType)
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry);
    }
}