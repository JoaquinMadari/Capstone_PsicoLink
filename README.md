Proyecto Capstone Duoc UC sede maipú

Seccion: 703D

Docente a cargo: Daniel Alonso Montero Valenzuela

Grupo: 5

Integrantes:
Fernando Cavada, Lucas Cisternas, Joaquín Madariaga



ARQUITECTURA ACTUAL DEL PROYECTO (INCOMPLETO)

```mermaid
flowchart LR
  subgraph Clients ["Clientes"]
    M["Ionic/Angular<br/>App móvil"]
    A["Panel Admin Web<br/>"]
  end

  subgraph API ["Backend API - Django REST"]
    direction TB
    U["Users & Auth<br/>JWT"]
    P["Profiles<br/>Paciente/Profesional/Org"]
    C["Catalog<br/>Especialidades"]
    S["Search<br/>Búsqueda de profesionales"]
    AP["Appointments<br/>CRUD + Busy + Validaciones"]
  end

  subgraph Data ["Datos & Plataforma"]
    DB[("PostgreSQL<br/>Supabase")]
  end

  M -->|HTTPS/JSON| API
  A -->|HTTPS/JSON| API

  API -->|ORM| DB

  %% Relaciones internas
  U -.-> P
  S -.-> P
  AP -.-> U
  AP -.-> P
  C -.-> P
```

```mermaid

flowchart TB
  subgraph "Django REST (Componentes)"
    Auth["Auth/Users<br/>JWT (SimpleJWT)"]
    Profiles["Profiles<br/>Pac/Psic/Org"]
    Catalog["Catálogo<br/>Especialidades"]
    Search["Search<br/>Profesionales"]
    Appointments["Appointments<br/>ViewSet + Busy"]
  end

  %% Quién usa a quién (dependencias internas)
  Auth -- "request.user / roles" --> Profiles
  Auth -- "request.user / roles" --> Appointments
  Auth -- "request.user / roles" --> Search

  Catalog -- "Enviar rol de especialidad" --> Profiles
  Catalog -- "filtros" --> Search

  Search -- "consulta perfiles (ORM)" --> Profiles
  Appointments -- "lee especialidad/rol" --> Profiles
```



```mermaid

flowchart LR
  %% === Clientes ===
  subgraph Clientes
    Mobile["App móvil<br/>Ionic/Angular"]
    Admin["Panel Admin Web<br/>(opcional)"]
  end

  %% === Backend API ===
  subgraph API["Backend API - Django REST"]
    direction TB
    Auth["Auth & Usuarios<br/>JWT (SimpleJWT), CORS"]
    Profiles["Perfiles<br/>Paciente / Profesional / Organización"]
    Catalog["Catálogo<br/>Especialidades (slug/label)"]
    Search["Búsqueda de profesionales<br/>filtros/orden"]
    App["Citas (Appointments)<br/>CRUD, Busy (horarios), reglas"]
    Valid["Validaciones<br/>solapamientos, duración, modalidad"]
    Files["Archivos<br/>certificados, CV (URL)"]
    Notify["Notificaciones<br/>(email opcional)"]
  end

  %% === Datos & Plataforma ===
  subgraph Datos["Datos & Plataforma"]
    DB[("PostgreSQL<br/>Supabase")]
    Storage[("Object Storage<br/>Supabase buckets / S3")]
    SMTP[("SMTP / Email<br/>(opcional)")]
  end

  %% === Flujos cliente <-> API ===
  Mobile -->|HTTPS / JSON| API
  Admin  -->|HTTPS / JSON| API

  %% === Dependencias internas de la API (quién usa a quién) ===
  Catalog --> Profiles
  Search  --> Profiles
  App     --> Profiles
  App     --> Valid
  Auth    --> Profiles
  Auth    --> App
  Auth    --> Search

  %% === API <-> Datos/Plataforma ===
  API -->|ORM| DB
  Files --> Storage
  Notify --> SMTP

```
