package org.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SprintSession {
    private String sessionId;
    private String goal;
    private List<UserStory> stories = new ArrayList<>();
    private List<SessionUser> activeUsers = new ArrayList<>();

    public SprintSession() {
    }

    public SprintSession(String sessionId, String goal, List<UserStory> stories) {
        this.sessionId = sessionId;
        this.goal = goal;
        this.stories = stories == null ? new ArrayList<>() : new ArrayList<>(stories);
        this.activeUsers = new ArrayList<>();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public List<UserStory> getStories() {
        return stories == null ? new ArrayList<>() : new ArrayList<>(stories);
    }

    public void setStories(List<UserStory> stories) {
        this.stories = stories == null ? new ArrayList<>() : new ArrayList<>(stories);
    }

    public List<SessionUser> getActiveUsers() {
        return activeUsers == null ? new ArrayList<>() : new ArrayList<>(activeUsers);
    }

    public void setActiveUsers(List<SessionUser> activeUsers) {
        this.activeUsers = activeUsers == null ? new ArrayList<>() : new ArrayList<>(activeUsers);
    }
}