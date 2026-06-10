<p align="center" style="background-color: rgba(24, 20, 20, 0.67); padding: 20px;">
  <img src="docs/media/logo.png" alt="PingMe banner" />
</p>

<p>
  <img src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java Badge" />
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot Badge" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge" alt="WebSocket Badge" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT Badge" />
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana Badge" />
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus Badge" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions Badge" />
  <img src="https://img.shields.io/badge/Logback-Logging-green?style=for-the-badge" alt="Logback Badge" />
</p>

> [!NOTE]
> PingMe is a full-stack real-time messaging application built with Spring Boot, React, WebSockets, and MongoDB. The project focuses on real-time communication, authentication, observability, and production-oriented development practices such as testing, monitoring, logging, and CI automation.

## 🎯 Project Overview

PingMe was designed to explore the architectural and engineering challenges involved in building a modern real-time application.

### Key areas explored

- Real-time communication using **WebSockets and STOMP**
- **MongoDB** and **NoSQL** data modeling
- **Google OAuth2** integration with Spring Security
- Comprehensive **integration testing**
- Application **observability and monitoring**
- **Rate limiting** and application security
- Git-based development workflows
- **CI pipeline** automation
- Application logging and diagnostics using **SLF4J and Logback**

## 🖼️ Application Preview

### Authentication

<p align="center">
  <img src="docs/media/auth.webp" alt="Authentication Page" />
</p>

### Contacts

<p align="center">
  <img src="docs/media/contacts.gif" alt="Contacts" />
</p>

### Private Chat

<p align="center">
  <img src="docs/media/privatechat.gif" alt="Private Chat" />
</p>

### Group Chat

<p align="center">
  <img src="docs/media/groupchat.gif" alt="Group Chat" />
</p>

### Monitoring Dashboard

<p align="center">
  <img src="docs/media/grafana.png" alt="Grafana Dashboard" />
</p>
<p align="center">
  <img src="docs/media/grafana2.png" alt="Grafana Dashboard" />
</p>
<p align="center">
  <img src="docs/media/grafana3.png" alt="Grafana Dashboard" />
</p>

## 🏗️ Project Architecture

<p align="center">
  <img src="docs/media/architecture.svg" alt="Architecture" />
</p>

## 🚀 Features

### 💬 Real-Time Messaging

- WebSocket-powered communication
	- Send and receive messages instantly
	- Edit and delete previously sent messages
- Support for text, image, and file messages
- Real-time notification sounds
- Unread message indicators
- Real-time typing indicators

---

### 👥 Contacts Management

- Add contacts/friends in real time
- Instant synchronization across connected clients
- Event-driven updates

---

### 🟢 Online Presence

- Live online/offline (last seen) status
- Presence synchronization in real time
- Instant updates when users connect or disconnect

---

### 👨‍👩‍👧‍👦 Group Chats

- Create group conversations
- Transfer ownership
- Promote members to moderators
- Demote moderators
- Remove members from groups
- Manage group roles and permissions
- Instant synchronization of membership changes across connected clients
- Automatic system-generated messages for:
  - Group management actions
  - Membership updates
  - Ownership transfers
  - Role changes


## 🔐 Authentication & Security

### Authentication Methods

- Local Sign Up / Sign In
- Google OAuth2 Login

### Security Highlights

- JWT-based stateless authentication
- OAuth2 integration with Google
- WebSocket connection authentication
- Rate limiting protection
- Role-based authorization

## 📊 Observability & Diagnostics

PingMe includes a monitoring and logging stack to provide visibility into application performance, health, and runtime behavior.

### Technologies

- Spring Boot Actuator
- Micrometer
- Prometheus
- Grafana
- SLF4J
- Logback

### Features

- HTTP request, JVM, memory, and CPU metrics
- Application health monitoring
- WebSocket and custom application metrics
- Structured application logging
- Rolling log files with daily rotation
- 30-day log retention
- Enhanced debugging and troubleshooting


## 🔄 Real-Time Event Architecture

PingMe uses dedicated WebSocket channels for different event categories:

| Path | Purpose |
|---------|---------|
| `/queue/messages` | Real-time chat messages |
| `/queue/events` | Contact updates, group events, system events |
| `/queue/presence` | Online/offline presence |
| `/topic/chat/{chatId}/typing` | Typing indicators |

This separation keeps event traffic organized and allows clients to subscribe only to the updates they require.

### Real-Time Message Flow

```mermaid
sequenceDiagram
    participant A as User A
    participant FE as React Client
    participant WS as WebSocket/STOMP
    participant BE as Spring Boot
    participant DB as MongoDB
    participant B as User B

    A->>FE: Send message
    FE->>WS: Publish message
    WS->>BE: Process event
    BE->>DB: Persist message
    BE-->>WS: Broadcast event
    WS-->>B: Deliver message instantly
    WS-->>A: Delivery confirmation
```

## 🔁 CI Pipeline

PingMe includes a Continuous Integration pipeline designed to simulate a real-world development workflow.

### CI Responsibilities

- Build verification
- Automated test execution
- Pull request validation
- Early integration issue detection


## ⚙️ Getting Started
 
### Prerequisites
 
- [Docker](https://www.docker.com/) and Docker Compose
### 1. Clone the repository
 
```bash
git clone https://github.com/RodrigoCoelhoo/pingme.git
cd pingme
```
 
### 2. Configure environment variables

Create a `.env` file inside the `frontend/` and `backend/` directory:
 
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```
 
Then fill in the required values:
 
```properties
# Cloudinary (https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
 
# Google OAuth2 (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```
 
**Cloudinary** - used for image uploads. Create a free account and grab the credentials from your dashboard.
 
**Google OAuth2** - used for google login. Create a project in Google Cloud Console, enable the Google+ API, and add:
- `http://localhost:5173` as an authorised javascript origin URI
- `http://localhost:8080/api/auth/google/callback` as an authorised redirect URI.
 
### 3. Start the application
 
```bash
docker compose -f docker-compose.dev.yml up --build
```
 
| Service       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:5173        |
| Backend API   | http://localhost:8080        |
| Mongo Express | http://localhost:8081        |
 
### 📈 Observability
 
PingMe exposes metrics via Spring Actuator + Micrometer, scraped by Prometheus and visualised in Grafana.
 
### 1. Start the observability container
 
```bash
cd monitoring
docker compose -f docker-compose.yml up -d
```
 
| Service    | URL                   | Credentials      |
|------------|-----------------------|------------------|
| Prometheus | http://localhost:9090 | ---------------- |
| Grafana    | http://localhost:3001 | admin / admin    |
| Actuator   | http://localhost:8080/actuator | ---------------- |
 
### 2. Add Prometheus as a data source

1. Open Grafana at http://localhost:3001
2. Go to **Connections → Data sources → Add new data source**
3. Select **Prometheus**
4. Set the URL to `http://prometheus:9090`
5. Click **Save & test**

### 3. Import the dashboard
 
1. Go to **Dashboards → New → Import**
2. Upload the file at `monitoring/grafana-dashboard.json`
3. Select the Prometheus data source and click **Import**