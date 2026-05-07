package org.example.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.example.backend.model.SprintSession;

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

    

    
}