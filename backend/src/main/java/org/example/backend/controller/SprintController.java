package org.example.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*") 
public class SprintController {

    private final Map<String, SprintSession> sprintStorage = new ConcurrentHashMap<>();

    @PostMapping
    public SprintSession createSprintSession() {
        String sessionId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        SprintSession newSession = new SprintSession(sessionId, "", new ArrayList<>());
        sprintStorage.put(sessionId, newSession);
        
        return newSession;
    }

    public static class SprintSession {
        private String sessionId;
        private String goal;
        private List<UserStory> stories;

        public SprintSession() {
        }

        public SprintSession(String sessionId, String goal, List<UserStory> stories) {
            this.sessionId = sessionId;
            this.goal = goal;
            this.stories = stories == null ? new ArrayList<>() : new ArrayList<>(stories);
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
    }

    public static class UserStory {
        private Long id;
        private String title;
        private String description;
        private String status;

        public UserStory() {
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}