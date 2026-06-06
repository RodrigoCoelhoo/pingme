package com.pingme.shared.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import static com.pingme.shared.metrics.MetricsConstants.*;

@Component
public class ChatMetrics {

    private final Counter chatsCreated;

    public ChatMetrics(MeterRegistry registry) {
        this.chatsCreated = Counter.builder(CHATS_CREATED)
                .description("Total group chats created")
                .register(registry);
    }

    public void recordChatCreated() {
        chatsCreated.increment();
    }
}