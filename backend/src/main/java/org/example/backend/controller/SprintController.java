package org.example.backend.controller;

import org.example.backend.model.SessionUser;
import org.example.backend.model.SprintSession;
import org.example.backend.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SprintController {

    private final SprintRepository sprintRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final long PRESENCE_TIMEOUT_MS = 15000;

    @Autowired
    public SprintController(SprintRepository sprintRepository, SimpMessagingTemplate messagingTemplate) {
        this.sprintRepository = sprintRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private void broadcastUpdate(SprintSession session) {
        messagingTemplate.convertAndSend("/topic/sprints/" + session.getSessionId(), session);
    }

    @PostMapping
    public SprintSession createSprintSession() {
        String sessionId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        SprintSession newSession = new SprintSession(sessionId, "", new ArrayList<>());
        sprintRepository.save(newSession);
        return newSession;
    }

    @GetMapping("/{sessionId}")
    public SprintSession getSprintSession(@PathVariable String sessionId) {
        SprintSession session = sprintRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        if (removeInactiveUsers(session)) {
            sprintRepository.save(session);
            broadcastUpdate(session);
        }
        return session;
    }

    @GetMapping("/history")
    public List<SprintSession> getSprintHistory() {
        return sprintRepository.findByCompletedTrue();
    }

    @PostMapping("/{sessionId}/complete")
    public SprintSession completeSprintSession(@PathVariable String sessionId) {
        SprintSession session = sprintRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));
        
        session.setCompleted(true);
        sprintRepository.save(session);
        broadcastUpdate(session);
        return session;
    }

    @PutMapping("/{sessionId}")
    public SprintSession updateSprintSession(@PathVariable String sessionId, @RequestBody SprintSession updatedSession) {
        return sprintRepository.findById(sessionId).map(existingSession -> {
            updatedSession.setSessionId(sessionId);
            updatedSession.setActiveUsers(existingSession.getActiveUsers());
            updatedSession.setCompleted(existingSession.isCompleted());
            
            sprintRepository.save(updatedSession);
            broadcastUpdate(updatedSession);
            return updatedSession;
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));
    }

    @PostMapping("/{sessionId}/presence")
    public SprintSession updatePresence(@PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        String normalizedSessionId = sessionId.trim().toUpperCase();
        SprintSession session = sprintRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        String userId = (body != null && body.get("userId") != null) ? body.get("userId").toString() : UUID.randomUUID().toString();
        String displayName = (body != null && body.get("displayName") != null) ? body.get("displayName").toString() : "Anonymous";

        List<SessionUser> activeUsers = session.getActiveUsers();
        long now = System.currentTimeMillis();
        boolean userExists = false;

        for (SessionUser activeUser : activeUsers) {
            if (activeUser.getUserId().equals(userId)) {
                activeUser.setDisplayName(displayName);
                activeUser.setLastSeen(now);
                userExists = true;
                break;
            }
        }

        if (!userExists) {
            activeUsers.add(new SessionUser(userId, displayName, now));
        }

        session.setActiveUsers(activeUsers);
        removeInactiveUsers(session);
        
        sprintRepository.save(session); 
        broadcastUpdate(session);
        return session;
    }

    @DeleteMapping("/{sessionId}/presence/{userId}")
    public SprintSession removePresence(@PathVariable String sessionId, @PathVariable String userId) {
        SprintSession session = sprintRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        List<SessionUser> activeUsers = session.getActiveUsers();
        if (activeUsers.removeIf(user -> user.getUserId().equals(userId))) {
            session.setActiveUsers(activeUsers);
            sprintRepository.save(session);
            broadcastUpdate(session);
        }
        return session;
    }

    private boolean removeInactiveUsers(SprintSession session) {
        long now = System.currentTimeMillis();
        List<SessionUser> activeUsers = session.getActiveUsers();
        boolean modified = activeUsers.removeIf(user -> now - user.getLastSeen() > PRESENCE_TIMEOUT_MS);
        if (modified) {
            session.setActiveUsers(activeUsers);
        }
        return modified;
    }
}