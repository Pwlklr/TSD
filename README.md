# TSD Project – Development Setup

This project consists of a **Spring Boot backend** and a **Angular frontend**, organized into separate folders:

```
backend/
frontend/
```

This document describes how to set up the environment, run each component, and understand the current tech stack.

---


# Required Tools

Refer to the setup instructions for each part of the system.

### **Backend (Java / Spring Boot)**

- **Java 21**.
- **Gradle Wrapper+( included as `./gradlew`)
- **MongoDB** *(Optional - depending on later stages**()

### **Frontend (Angular)**

- **Node.js 20.x LTS** (Angular CLI requires >= 20.19)
- **npm** (bundled with Node)
- **Angular CLI**
+ **How to install**
```bash
npm install -g @angular/cli
```

### **Reconmended Tools**

- IntelliJIEDA / VSCode
- Postman / Thunder Client
- Git

---


# How to Run the Project

Before you start, make sure to have all tools installed from the **Required Tools** section above.

### 1. **Backend (Spring Boot)**

Navigate to the backend directory:

```bash
cd backend
```

Run the application:

```bash
./gradlew bootRun
```

Run tests:

```bash
./gradlew test
```

Rebuild the backend:

```bash
./gradlew build
```

Backend will start on:

*http://localhost:8080


---


### 2. **Frontend (Angular)**

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm start
```

Application available at:

http://localhost:4200

Angular dev server reloads automatically on changes.


---

# Tech Stack
The stack for this stage includes:

### Backend
- Java 21
- Spring Boot 3.x
- REST API
- Gradle
- SpotBugs & Checkstyle
- JUnit 5

### Frontend
- Angular 18
- TypeScript
- SCSS
- Angular Routing
- Angular CLI

### CI/CD
- Git Hub Actions
  - Backend build & test
  - Static analysis (SpotBugs)
  - Angular build & test
  - npm & Gradle caching

---

# Team Members

| Name         | Role           |
|-------------------|--------------|
| **Pawel Kelar** | Developer |
| **Filip Urbanski** | Developer |
| **Wojciech Szott** | Developer    |
| **Jakub Luzak** | Developer |
