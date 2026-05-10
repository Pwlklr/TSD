package org.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.example.backend.model.SprintSession;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SprintController {

    private final Map<String, SprintSession> sprintStorage = new ConcurrentHashMap<>();

    @PostMapping
    public SprintSession createSprintSession() {
        String sessionId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        SprintSession newSession = new SprintSession(sessionId, "", new ArrayList<>());
        sprintStorage.put(sessionId, newSession);
        
        System.out.println("Utworzono nowa sesje: " + sessionId);
        return newSession;
    }

    @GetMapping("/{sessionId}")
    public SprintSession getSprintSession(@PathVariable String sessionId) {
        SprintSession session = sprintStorage.get(sessionId);

        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found");
        }
        return session;
    }

    @PutMapping("/{sessionId}")
    public SprintSession updateSprintSession(@PathVariable String sessionId, @RequestBody SprintSession updatedSession) {
        if (sprintStorage.containsKey(sessionId)) {
            updatedSession.setSessionId(sessionId);
            sprintStorage.put(sessionId, updatedSession);
            
            System.out.println("Zaktualizowano sesje: " + sessionId + " | Ilosc UserStories: " + updatedSession.getStories().size());
            return updatedSession;
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found");
    }
}