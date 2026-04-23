SYSTEM ARCHITECTURE
Layers
UI Layer (React)
Displays data
No business logic
No API calls
State Layer (Zustand)
Holds runtime state
Controls UI behavior
Domain Layer (Workout Engine)
FSM (Finite State Machine)
Validates actions
Creates events
Local DB (Dexie)
Source of truth
Stores events + projections
Sync Engine
Background process
Pushes data to backend
Backend (Supabase)
Storage + backup only
Rules
UI NEVER talks to backend
All writes go through events
Local DB is always trusted
