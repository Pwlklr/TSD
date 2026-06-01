package org.example.backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Override
    protected String getDatabaseName() {
        return "sprintdb";
    }

    @Override
    public MongoClient mongoClient() {
        String uri = System.getenv("SPRING_DATA_MONGODB_URI");
        
        if (uri == null || uri.isBlank()) {
            uri = "mongodb://mongodb:27017/sprintdb";
        }
    
        return MongoClients.create(uri);
    }
}