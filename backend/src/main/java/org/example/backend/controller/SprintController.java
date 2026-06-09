package org.example.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.model.SessionUser;
import org.example.backend.model.SprintSession;
import org.example.backend.repository.SprintRepository;
import org.example.backend.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Slf4j

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(
        origins = "*",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
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

    private AuthenticatedUser getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return (AuthenticatedUser) authentication.getPrincipal();
    }

    @PostMapping
    public SprintSession createSprintSession() {
        String sessionId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        SprintSession newSession = new SprintSession(sessionId, "", new ArrayList<>());
        sprintRepository.save(newSession);

log.info("Session created");
        return newSession;
    }

    @GetMapping("/{sessionId}")
    public SprintSession getSprintSession(@PathVariable String sessionId) {
        String normalizedSessionId = sessionId.trim().toUpperCase();
        SprintSession session = sprintRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        if (removeInactiveUsers(session)) {
            sprintRepository.save(session);
            broadcastUpdate(session);
        }

        return session;
    }

    @GetMapping("/history")
    public List<SprintSession> getSprintHistory(Authentication authentication) {
        AuthenticatedUser user = getAuthenticatedUser(authentication);

        return sprintRepository.findByCompletedTrueAndParticipantUserIdsContaining(user.getUserId());
    }

    @PostMapping("/{sessionId}/complete")
    public SprintSession completeSprintSession(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        getAuthenticatedUser(authentication);

        String normalizedSessionId = sessionId.trim().toUpperCase();

        SprintSession session = sprintRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        session.setCompleted(true);
        sprintRepository.save(session);
        broadcastUpdate(session);
        return session;
    }

    @PutMapping("/{sessionId}")
    public SprintSession updateSprintSession(
            @PathVariable String sessionId,
            @RequestBody SprintSession updatedSession,
            Authentication authentication
    ) {
        getAuthenticatedUser(authentication);

        String normalizedSessionId = sessionId.trim().toUpperCase();

        return sprintRepository.findById(normalizedSessionId).map(existingSession -> {
            updatedSession.setSessionId(normalizedSessionId);
            updatedSession.setActiveUsers(existingSession.getActiveUsers());
            updatedSession.setCompleted(existingSession.isCompleted());
            updatedSession.setParticipantUserIds(existingSession.getParticipantUserIds());
            sprintRepository.save(updatedSession);
            broadcastUpdate(updatedSession);
            return updatedSession;
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));
    }

    @PostMapping("/{sessionId}/presence")
    public SprintSession updatePresence(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        AuthenticatedUser user = getAuthenticatedUser(authentication);

        String normalizedSessionId = sessionId.trim().toUpperCase();
        SprintSession session = sprintRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        List<SessionUser> activeUsers = session.getActiveUsers();
        List<String> participantUserIds = session.getParticipantUserIds();
        long now = System.currentTimeMillis();
        boolean userExists = false;

        for (SessionUser activeUser : activeUsers) {
            if (activeUser.getUserId().equals(user.getUserId())) {
                activeUser.setDisplayName(user.getUsername());
                activeUser.setLastSeen(now);
                userExists = true;
                break;
            }
        }

        if (!userExists) {
            activeUsers.add(new SessionUser(user.getUserId(), user.getUsername(), now));
        }

        if (!participantUserIds.contains(user.getUserId())) {
            participantUserIds.add(user.getUserId());
        }

        session.setActiveUsers(activeUsers);
        session.setParticipantUserIds(participantUserIds);
        removeInactiveUsers(session);

        sprintRepository.save(session);
        broadcastUpdate(session);
        return session;
    }

    @DeleteMapping("/{sessionId}/presence/{userId}")
    public SprintSession removePresence(
            @PathVariable String sessionId,
            @PathVariable String userId,
            Authentication authentication
    ) {
        AuthenticatedUser user = getAuthenticatedUser(authentication);

        if (!user.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only remove your own presence");
        }

        String normalizedSessionId = sessionId.trim().toUpperCase();

        SprintSession session = sprintRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        List<SessionUser> activeUsers = session.getActiveUsers();

        if (activeUsers.removeIf(activeUser -> activeUser.getUserId().equals(user.getUserId()))) {
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

    @DeleteMapping("/history/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSprintFromHistory(@PathVariable String sessionId) {
        SprintSession session = sprintRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint session not found"));

        if (!session.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete an active sprint from history");
        }

        sprintRepository.delete(session);
    }
}