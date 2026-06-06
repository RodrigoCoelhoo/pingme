package com.pingme.shared.exceptions;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.pingme.shared.metrics.MetricsConstants.BACKEND_ERRORS;
import static com.pingme.shared.metrics.MetricsConstants.TAG_EXCEPTION;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionsHandler {

    private final MeterRegistry meterRegistry;

    private Map<String, Object> globalExceptionHeader(HttpStatus status, String error) {
        Map<String, Object> body = new LinkedHashMap<>();

        ZonedDateTime portugalTime = ZonedDateTime.now(ZoneId.of("Europe/Lisbon"));
        String formatted = portugalTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"));
        String timestamp = formatted + " PT(UTC" + portugalTime.getOffset().getId() + ")";

        body.put("timestamp", timestamp);
        body.put("status", status.value());
        body.put("error", error);
        return body;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception ex) {
        recordError(ex);
        log.error("Unhandled exception", ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error");
        body.put("message", "Something went wrong");
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ResourceNotFound.class)
    public ResponseEntity<Object> resourceNotFoundHandler(ResourceNotFound ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.NOT_FOUND, "Resource not found");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationErrors(MethodArgumentNotValidException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.BAD_REQUEST, "Bad Request");

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        body.put("message", "Validation failed");
        body.put("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Object> handleBadCredentials(BadCredentialsException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.UNAUTHORIZED, "Unauthorized");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Object> handleInvalidToken(InvalidTokenException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.UNAUTHORIZED, "Unauthorized");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Object> handleBadRequest(BadRequestException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.BAD_REQUEST, "Bad Request");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<Object> handleResourceAlreadyExistsException(ResourceAlreadyExistsException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.CONFLICT, "Conflict");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(TokenGenerationException.class)
    public ResponseEntity<Object> handleTokenGeneration(TokenGenerationException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error");
        body.put("message", "Error generating authentication token");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(ContactConflictException.class)
    public ResponseEntity<Object> handleContactConflict(ContactConflictException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.CONFLICT, "Conflict");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Object> handleForbiddenException(ForbiddenException ex) {
        recordError(ex);
        Map<String, Object> body = globalExceptionHeader(HttpStatus.FORBIDDEN, "Forbidden");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    private void recordError(Exception ex) {
        log.info("Recording metric for {}", ex.getClass().getSimpleName());
        meterRegistry.counter(BACKEND_ERRORS, TAG_EXCEPTION, ex.getClass().getSimpleName()).increment();
    }
}
