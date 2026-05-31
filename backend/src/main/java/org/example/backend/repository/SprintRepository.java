package org.example.backend.repository;

import org.example.backend.model.SprintSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends MongoRepository<SprintSession, String> {
    List<SprintSession> findByCompletedTrue();
}