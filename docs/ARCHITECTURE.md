# Architecture Diagram

## System Overview

The Titanium Guardian application is a cybersecurity risk assessment platform designed for senior citizens. It consists of a cross-platform Flutter frontend and a Python FastAPI backend with specialized risk assessment engines.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        iOS[iOS App]
        Android[Android App]
        Desktop[Desktop Apps<br/>Windows/Linux/macOS]
    end

    subgraph "Frontend - Flutter Application"
        FlutterApp[Flutter App<br/>lib/main.dart]
        HomeScreen[Home Screen]
        Modules[Feature Modules]
        Widgets[UI Widgets]
        API_Client[API Client<br/>HTTP Requests]
    end

    subgraph "Backend - FastAPI Server"
        FastAPI[FastAPI Application<br/>main.py]
        Auth[API Key Authentication]
        CORS[CORS Middleware]
        Routes[API Routes]
    end

    subgraph "Risk Assessment Engines"
        CallGuard[CallGuard<br/>Phone Call Analysis]
        MoneyGuard[MoneyGuard<br/>Payment Risk Assessment]
        InboxGuard[InboxGuard<br/>Email/Message Analysis]
        IdentityWatch[IdentityWatch<br/>Identity Monitoring]
        BaseEngine[Base Engine<br/>Common Utilities]
    end

    subgraph "Storage Layer"
        MemoryStore[MemoryStore<br/>Session Management]
        Profiles[Identity Profiles<br/>In-Memory Dict]
    end

    subgraph "Infrastructure"
        Docker[Docker Containers]
        DockerCompose[Docker Compose]
    end

    Web --> FlutterApp
    iOS --> FlutterApp
    Android --> FlutterApp
    Desktop --> FlutterApp

    FlutterApp --> HomeScreen
    HomeScreen --> Modules
    Modules --> Widgets
    Widgets --> API_Client

    API_Client -->|HTTP/REST| FastAPI
    FastAPI --> Auth
    FastAPI --> CORS
    FastAPI --> Routes

    Routes --> CallGuard
    Routes --> MoneyGuard
    Routes --> InboxGuard
    Routes --> IdentityWatch

    CallGuard --> BaseEngine
    MoneyGuard --> BaseEngine
    InboxGuard --> BaseEngine
    IdentityWatch --> BaseEngine

    Routes --> MemoryStore
    IdentityWatch --> Profiles

    Docker --> FastAPI
    Docker --> FlutterApp
    DockerCompose --> Docker
```

## Detailed Component Architecture

### Frontend Architecture

```mermaid
graph LR
    subgraph "Flutter Frontend"
        Main[main.dart<br/>App Entry Point]
        Home[Home Screen<br/>home_screen.dart]
        
        subgraph "Feature Modules"
            CG[CallGuard Module]
            MG[MoneyGuard Module]
            IG[InboxGuard Module]
            IW[IdentityWatch Module]
        end
        
        subgraph "UI Components"
            Nav[Navigation Bar]
            Hero[Hero Section]
            Grid[Feature Grid]
            Footer[Footer Section]
            Insights[Insights Section]
        end
        
        subgraph "Utilities"
            Cache[Request Caching<br/>5min TTL]
            Debounce[Debouncing<br/>500ms]
            Validation[Input Validation]
        end
    end
    
    Main --> Home
    Home --> CG
    Home --> MG
    Home --> IG
    Home --> IW
    Home --> Nav
    Home --> Hero
    Home --> Grid
    Home --> Footer
    Home --> Insights
    
    CG --> Cache
    MG --> Cache
    IG --> Cache
    IW --> Cache
    
    CG --> Debounce
    MG --> Debounce
    IG --> Debounce
    
    CG --> Validation
    MG --> Validation
    IG --> Validation
    IW --> Validation
```

### Backend Architecture

```mermaid
graph TB
    subgraph "API Layer"
        Endpoints[API Endpoints]
        SessionAPI[/v1/session/*<br/>Session Management]
        MoneyAPI[/v1/moneyguard/*<br/>Payment Assessment]
        InboxAPI[/v1/inboxguard/*<br/>Message Analysis]
        IdentityAPI[/v1/identitywatch/*<br/>Identity Monitoring]
    end

    subgraph "Request Processing"
        Validation[Input Validation<br/>Pydantic Models]
        Auth[API Key Verification]
        ErrorHandling[Error Handling<br/>& Logging]
    end

    subgraph "Risk Engines"
        CallGuard[CallGuard Engine]
        MoneyGuard[MoneyGuard Engine]
        InboxGuard[InboxGuard Engine]
        IdentityWatch[IdentityWatch Engine]
    end

    subgraph "Storage"
        Sessions[Session Storage<br/>MemoryStore]
        ProfileStorage[Profile Storage<br/>In-Memory Dict]
    end

    Endpoints --> SessionAPI
    Endpoints --> MoneyAPI
    Endpoints --> InboxAPI
    Endpoints --> IdentityAPI

    SessionAPI --> Validation
    MoneyAPI --> Validation
    InboxAPI --> Validation
    IdentityAPI --> Validation

    Validation --> Auth
    Auth --> ErrorHandling

    SessionAPI --> CallGuard
    MoneyAPI --> MoneyGuard
    InboxAPI --> InboxGuard
    IdentityAPI --> IdentityWatch

    CallGuard --> Sessions
    MoneyGuard --> Sessions
    InboxGuard --> Sessions
    IdentityWatch --> ProfileStorage
    IdentityWatch --> Sessions
```

## Data Flow

### Risk Assessment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Auth
    participant Engine
    participant Storage

    User->>Frontend: Submit Risk Assessment
    Frontend->>Frontend: Validate Input
    Frontend->>Frontend: Check Cache (5min TTL)
    alt Cache Hit
        Frontend->>User: Return Cached Result
    else Cache Miss
        Frontend->>API: HTTP POST Request
        API->>Auth: Verify API Key
        alt Invalid Key
            Auth->>Frontend: 401/403 Error
        else Valid Key
            API->>API: Validate Request Data
            API->>Engine: Assess Risk
            Engine->>Engine: Calculate Risk Score
            Engine->>Engine: Generate Reasons
            Engine->>Engine: Determine Risk Level
            Engine->>API: Return RiskResponse
            API->>Storage: Store Session (if applicable)
            API->>Frontend: Return RiskResponse
            Frontend->>Frontend: Cache Result
            Frontend->>User: Display Risk Assessment
        end
    end
```

### Session Management Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Storage
    participant Engine

    Client->>API: POST /v1/session/start
    API->>Storage: Create Session
    Storage->>Storage: Generate Session ID
    Storage->>API: Return SessionRecord
    API->>Client: Return Session ID

    loop During Session
        Client->>API: POST /v1/session/{id}/event
        API->>Storage: Append Event
        Storage->>Storage: Update last_accessed_at
        API->>Engine: Assess Risk
        Engine->>API: Return RiskResponse
        API->>Storage: Update last_risk
        API->>Client: Return RiskResponse
    end

    Client->>API: POST /v1/session/{id}/end
    API->>Storage: Get Session
    API->>Storage: Generate Summary
    API->>Client: Return SessionSummary
```

## Risk Engine Architecture

```mermaid
graph TB
    subgraph "Base Engine"
        Base[base.py]
        ClampScore[clamp_score<br/>0-100 range]
        ScoreToLevel[score_to_level<br/>low/medium/high]
        BuildResponse[build_risk_response<br/>Create RiskResponse]
    end

    subgraph "CallGuard"
        CG[callguard.py]
        CGAnalysis[Signal Analysis<br/>Red Flags Detection]
        CGScoring[Risk Scoring<br/>Based on Signals]
    end

    subgraph "MoneyGuard"
        MG[moneyguard.py]
        MGAnalysis[Payment Analysis<br/>Amount, Method, Flags]
        MGScoring[Risk Scoring<br/>Urgency, Secrecy, etc.]
        MGSafeSteps[Safe Steps Guide]
    end

    subgraph "InboxGuard"
        IG[inboxguard.py]
        IGText[Text Analysis<br/>Phishing Detection]
        IGURL[URL Analysis<br/>Suspicious Link Detection]
        IGScoring[Risk Scoring<br/>Based on Patterns]
    end

    subgraph "IdentityWatch"
        IW[identitywatch.py]
        IWProfile[Profile Management]
        IWSignals[Signal Analysis<br/>Identity Theft Indicators]
        IWScoring[Risk Scoring<br/>Based on Signals]
    end

    CG --> Base
    MG --> Base
    IG --> Base
    IW --> Base

    CGAnalysis --> CGScoring
    MGAnalysis --> MGScoring
    IGText --> IGScoring
    IGURL --> IGScoring
    IWSignals --> IWScoring

    CGScoring --> BuildResponse
    MGScoring --> BuildResponse
    IGScoring --> BuildResponse
    IWScoring --> BuildResponse
```

## Storage Architecture

```mermaid
graph TB
    subgraph "MemoryStore"
        Store[MemoryStore Class]
        Sessions[Session Dictionary<br/>session_id -> SessionRecord]
        TTL[Session TTL<br/>Configurable, Default 24h]
        Cleanup[Background Cleanup Task<br/>Runs Hourly]
    end

    subgraph "SessionRecord"
        SessionID[Session ID<br/>UUID]
        Module[Module Name]
        UserID[User ID]
        DeviceID[Device ID]
        Events[Event List]
        LastRisk[Last Risk Response]
        Timestamps[Created/Last Accessed]
    end

    subgraph "Identity Profiles"
        Profiles[Profile Dictionary<br/>profile_id -> Profile]
        ProfileData[Email, Phone, Name, State]
    end

    Store --> Sessions
    Sessions --> SessionID
    Sessions --> Module
    Sessions --> UserID
    Sessions --> DeviceID
    Sessions --> Events
    Sessions --> LastRisk
    Sessions --> Timestamps

    Store --> TTL
    Store --> Cleanup
    Cleanup --> Sessions

    IW[IdentityWatch] --> Profiles
    Profiles --> ProfileData
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        LocalDev[Local Development]
        FlutterDev[Flutter Run<br/>Hot Reload]
        UvicornDev[Uvicorn --reload]
    end

    subgraph "Docker Environment"
        DockerCompose[docker-compose.yml]
        
        subgraph "Backend Container"
            BackendImg[Backend Dockerfile]
            BackendContainer[Backend Container<br/>Port 8000]
            BackendCode[Backend Code Volume]
        end
        
        subgraph "Frontend Container"
            FrontendImg[Frontend Dockerfile]
            FrontendContainer[Frontend Container<br/>Port 8080]
            FrontendBuild[Static Build Files]
        end
        
        Network[Titanium Network<br/>Bridge Network]
    end

    subgraph "Production"
        ProdBackend[Production Backend]
        ProdFrontend[Production Frontend]
        LoadBalancer[Load Balancer<br/>Optional]
    end

    LocalDev --> FlutterDev
    LocalDev --> UvicornDev

    DockerCompose --> BackendImg
    DockerCompose --> FrontendImg
    BackendImg --> BackendContainer
    FrontendImg --> FrontendContainer
    BackendContainer --> Network
    FrontendContainer --> Network
    BackendContainer --> BackendCode

    BackendContainer --> ProdBackend
    FrontendContainer --> ProdFrontend
    ProdBackend --> LoadBalancer
    ProdFrontend --> LoadBalancer
```

## Technology Stack

### Frontend
- **Framework**: Flutter (Dart)
- **Platforms**: Web, iOS, Android, Windows, Linux, macOS
- **State Management**: Flutter StatefulWidget
- **HTTP Client**: Dart http package
- **Caching**: In-memory cache with TTL
- **Accessibility**: ARIA labels, semantic widgets, keyboard navigation

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic models
- **Authentication**: API Key (X-API-Key header)
- **CORS**: FastAPI CORS middleware
- **Logging**: Python logging module
- **Storage**: In-memory (MemoryStore) - can be extended to database

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions (configured)
- **Testing**: pytest (backend), Flutter test (frontend)

## Key Design Patterns

1. **Modular Risk Engines**: Each risk assessment module (CallGuard, MoneyGuard, etc.) is independent and follows a common interface
2. **Session-Based Assessment**: Supports multi-event sessions for complex risk scenarios
3. **Stateless API**: Backend is stateless except for session storage (can be moved to external database)
4. **Caching Strategy**: Frontend caches API responses to reduce load and improve UX
5. **Input Validation**: Multiple layers of validation (frontend, Pydantic models, risk engines)
6. **Error Handling**: Comprehensive error handling with user-friendly messages
7. **Background Tasks**: Session cleanup runs as a background daemon thread

## Security Considerations

- API Key authentication for backend access
- Input validation and sanitization
- CORS configuration (currently permissive for development)
- Session TTL to prevent indefinite storage
- No sensitive data in logs
- Environment variable configuration for secrets

## Future Enhancements

- Database integration for persistent storage
- Redis for session management
- Rate limiting
- OAuth2/JWT authentication
- WebSocket support for real-time updates
- Analytics and monitoring integration
- Multi-tenant support

