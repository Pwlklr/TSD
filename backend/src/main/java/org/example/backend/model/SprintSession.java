package org.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "sprints")
@JsonIgnoreProperties(ignoreUnknown = true)
public class SprintSession {

    @Id
    private String sessionId;

    private String goal;
    private boolean completed;
    private List<UserStory> stories = new ArrayList<>();
    private List<SessionUser> activeUsers = new ArrayList<>();
    private List<String> participantUserIds = new ArrayList<>();

    public SprintSession() {
        this.completed = false;
    }

    public SprintSession(String sessionId, String goal, List<UserStory> stories) {
        this.sessionId = sessionId;
        this.goal = goal;
        this.stories = stories == null ? new ArrayList<>() : new ArrayList<>(stories);
        this.activeUsers = new ArrayList<>();
        this.participantUserIds = new ArrayList<>();
        this.completed = false;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

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

    public List<String> getParticipantUserIds() {
        return participantUserIds == null ? new ArrayList<>() : new ArrayList<>(participantUserIds);
    }

    public void setParticipantUserIds(List<String> participantUserIds) {
        this.participantUserIds = participantUserIds == null ? new ArrayList<>() : new ArrayList<>(participantUserIds);
    }
}