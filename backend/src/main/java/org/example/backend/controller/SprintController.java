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
        public String sessionId;
        public String goal;
        public List<UserStory> stories;

        public SprintSession(String sessionId, String goal, List<UserStory> stories) {
            this.sessionId = sessionId;
            this.goal = goal;
            this.stories = stories;
        }
    }

    public static class UserStory {
        public Long id;
        public String title;
        public String description;
        public String status;
    }
}