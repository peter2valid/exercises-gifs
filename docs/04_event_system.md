EVENT SYSTEM
Concept

All user actions are stored as immutable events.

Event Types
SESSION_STARTED
SET_LOGGED
REST_STARTED
SESSION_COMPLETED
SET_EDITED
SET_DELETED
Rules
Events are append-only
No updates or deletes
Events are replayable
Flow

Action -> Event -> Store -> Reducer -> Projection
