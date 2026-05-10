package org.example.backend.model;

import java.util.ArrayList;
import java.util.List;

public class SprintSession {
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