package com.pingme.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.pingme.users.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(secret);
    }

    // ------------------------ ACCESS TOKEN --------------------------------

    public String generateAccessToken(User user) {
        try {
            return JWT.create()
                    .withIssuer("auth-api")
                    .withSubject(user.getId())
                    .withClaim("type", "access")
                    .withExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                    .sign(getAlgorithm());
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Error while generating access token", exception);
        }
    }

    public String validateAccessToken(String token) {
        try {
            return JWT.require(getAlgorithm())
                    .withIssuer("auth-api")
                    .withClaim("type", "access")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return null;
        }
    }

    // ------------------------ REFRESH TOKEN --------------------------------

    public String generateRefreshToken(User user) {
        try {
            return JWT.create()
                    .withIssuer("auth-api")
                    .withSubject(user.getId())
                    .withClaim("type", "refresh")
                    .withExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                    .sign(getAlgorithm());
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Error while generating refresh token", exception);
        }
    }

    public String validateRefreshToken(String token) {
        try {
            return JWT.require(getAlgorithm())
                    .withIssuer("auth-api")
                    .withClaim("type", "refresh")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return null;
        }
    }
}
