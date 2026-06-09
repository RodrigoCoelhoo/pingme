package com.pingme.shared.metrics;

import com.pingme.users.UserRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

@Component
public class UserMetrics {

    public UserMetrics(
            MeterRegistry meterRegistry,
            UserRepository userRepository
    ) {
        Gauge.builder("chat_registered_users",
                userRepository,
                CrudRepository::count)
        .register(meterRegistry);
    }
}
