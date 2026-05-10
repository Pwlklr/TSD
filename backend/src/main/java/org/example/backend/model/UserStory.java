package org.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserStory {
    private Long id;
    private String title;
    private String description;
    private String status;
    private List<ProductBacklogItem> backlogItems = new ArrayList<>();

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

    public List<ProductBacklogItem> getBacklogItems() { 
        return backlogItems == null ? new ArrayList<>() : new ArrayList<>(backlogItems); 
    }
    
    public void setBacklogItems(List<ProductBacklogItem> backlogItems) { 
        this.backlogItems = backlogItems == null ? new ArrayList<>() : new ArrayList<>(backlogItems); 
    }
}