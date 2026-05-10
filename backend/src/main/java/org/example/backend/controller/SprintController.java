package org.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.example.backend.model.SessionUser;
import org.example.backend.model.SprintSession;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SprintController {

    private final Map<String, SprintSession> sprintStorage = new ConcurrentHashMap<>();
    private static final long PRESENCE_TIMEOUT_MS = 15000;

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

        removeInactiveUsers(session);
        return session;
    }

    @PutMapping("/{sessionId}")
    public SprintSession updateSprintSession(@PathVariable String sessionId, @RequestBody SprintSession updatedSession) {
        if (sprintStorage.containsKey(sessionId)) {
            SprintSession existingSession = sprintStorage.get(sessionId);
            updatedSession.setSessionId(sessionId);
            updatedSession.setActiveUsers(existingSession.getActiveUsers());
            sprintStorage.put(sessionId, updatedSession);

            System.out.println("Zaktualizowano sesje: " + sessionId + " | Ilosc UserStories: " + updatedSession.getStories().size());
            return updatedSession;
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found");
    }

    @PostMapping("/{sessionId}/presence")
    public SprintSession updatePresence(@PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        String normalizedSessionId = sessionId.trim().toUpperCase();
        SprintSession session = sprintStorage.get(normalizedSessionId);

        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found");
        }

        String userId = null;
        String displayName = null;

        if (body != null) {
            Object userIdValue = body.get("userId");
            Object displayNameValue = body.get("displayName");

            if (userIdValue != null) {
                userId = userIdValue.toString();
            }

            if (displayNameValue != null) {
                displayName = displayNameValue.toString();
            }
        }

        if (userId == null || userId.isBlank()) {
            userId = UUID.randomUUID().toString();
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = "Anonymous";
        }

        System.out.println("Presence request: sessionId=" + normalizedSessionId
                + ", userId=" + userId
                + ", displayName=" + displayName);

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
            SessionUser newUser = new SessionUser(userId, displayName, now);
            activeUsers.add(newUser);
        }

        session.setActiveUsers(activeUsers);
        removeInactiveUsers(session);

        System.out.println("Active users count: " + session.getActiveUsers().size());

        return session;
    }

    @DeleteMapping("/{sessionId}/presence/{userId}")
    public SprintSession removePresence(@PathVariable String sessionId, @PathVariable String userId) {
        SprintSession session = sprintStorage.get(sessionId);

        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found");
        }

        List<SessionUser> activeUsers = session.getActiveUsers();
        activeUsers.removeIf(user -> user.getUserId().equals(userId));
        session.setActiveUsers(activeUsers);

        return session;
    }

    private void removeInactiveUsers(SprintSession session) {
        long now = System.currentTimeMillis();

        List<SessionUser> activeUsers = session.getActiveUsers();
        activeUsers.removeIf(user -> now - user.getLastSeen() > PRESENCE_TIMEOUT_MS);
        session.setActiveUsers(activeUsers);
    }
}