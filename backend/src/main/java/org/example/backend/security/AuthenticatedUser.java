package org.example.backend.security;

public class AuthenticatedUser {

    private final String userId;
    private final String username;
    private final String email;

    public AuthenticatedUser(String userId, String username, String email) {
        this.userId = userId;
        this.username = username;
        this.email = email;
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }
}