package com.pingme.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private record RequestCount(AtomicInteger count, Instant windowStart) {}

    private final Map<String, RequestCount> authRequests = new ConcurrentHashMap<>();
    private final Map<String, RequestCount> apiRequests = new ConcurrentHashMap<>();

    private boolean isAllowed(Map<String, RequestCount> buckets, String key, int maxRequests, Duration window) {
        Instant now = Instant.now();

        RequestCount current = buckets.compute(key, (k, v) -> {
            if (v == null || now.isAfter(v.windowStart().plus(window))) {
                return new RequestCount(new AtomicInteger(1), now); // new window
            }
            v.count().incrementAndGet();
            return v;
        });

        return current.count().get() <= maxRequests;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();

        boolean allowed = path.startsWith("/api/auth")
                ? isAllowed(authRequests, ip, 5, Duration.ofMinutes(1))
                : isAllowed(apiRequests, ip, 100, Duration.ofMinutes(1));

        if (allowed) {
            chain.doFilter(request, response);
        }
        else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.addHeader("Retry-After", "60");
            response.getWriter().write("Too many requests");
        }
    }
}
