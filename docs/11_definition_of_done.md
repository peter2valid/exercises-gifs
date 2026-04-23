DEFINITION OF DONE (DoD)

General Rule
A task is NOT done until it is:
working
tested
reproducible
committed

Day 1 — Dexie Foundation
Done when:
DB initializes without errors
All tables exist
You can insert + read from each table
No TypeScript errors
Console test passes

Day 2 — Event System
Done when:
Events are created correctly
Deterministic IDs work
Events stored in DB
sync_queue updated
No duplicate event issues

Day 3 — Reducer System
Done when:
applyEvent works for all event types
Projections update correctly
No inconsistent data
Replay produces same result

Day 4 — Simulation
Done when:
Full workout runs in console
No UI required
Replay restores exact state

Global Rule
If you cannot:
simulate
break it
recover it
Then it is NOT done.
