Proyecto Capstone Duoc UC sede maipú

Seccion: 703D

Docente a cargo: Daniel Alonso Montero Valenzuela

Grupo: 5

Integrantes:
Fernando Cavada, Lucas Cisternas, Joaquín Madariaga






```mermaid
flowchart LR
  subgraph Clients[Clientes]
    M[Ionic/Angular\nApp móvil]
    A[Panel Admin Web\n(opcional)]
  end

  subgraph API[Backend API - Django REST]
    direction TB
    U[Users & Auth\n(JWT)]
    P[Profiles\n(Paciente/Profesional/Org)]
    C[Catalog\n(Especialidades)]
    S[Search\n(Búsqueda de profesionales)]
    AP[Appointments\n(CRUD + Busy + Validaciones)]
    N[Notifications\n(opcional)]
  end

  subgraph Data[Datos & Plataforma]
    DB[(PostgreSQL\nSupabase)]
    ST[(Storage\nSupabase/S3)]
    R[(Redis\nopcional)]
    LG[(Logs/Métricas\nSentry/ELK)]
  end

  M -->|HTTPS/JSON| API
  A -->|HTTPS/JSON| API

  API -->|ORM| DB
  API -->|archivos| ST
  API -->|cache/colas| R
  API -->|eventos/logs| LG

  %% Relaciones internas
  U -.-> P
  S -.-> P
  AP -.-> U
  AP -.-> P
  C -.-> P
