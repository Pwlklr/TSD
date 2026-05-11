package org.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SessionUser {
    private String userId;
    private String displayName;
    private long lastSeen;

    public SessionUser(String userId, String displayName, long lastSeen) {
        this.userId = userId;
        this.displayName = displayName;
        this.lastSeen = lastSeen;
    }

    public SessionUser() {
    }

    public String getUserId() {
        return this.userId;
    }

    public String getDisplayName() {
        return this.displayName;
    }

    public long getLastSeen() {
        return this.lastSeen;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setLastSeen(long lastSeen) {
        this.lastSeen = lastSeen;
    }

}