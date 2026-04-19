package com.pingme.users;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}