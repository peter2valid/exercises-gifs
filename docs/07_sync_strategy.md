SYNC STRATEGY
Model

Write Local -> Sync Behind

Flow

Event created -> stored locally -> queued -> synced later

Rules
Sync never blocks UI
Retry on failure
Batch events
Conflict Handling
Events are merged chronologically
Last-write-wins for projections
