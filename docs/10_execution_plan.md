MASTER EXECUTION PLAN (FOUNDATION -> LAUNCH)
Timeline
21 Days

Week 1
FOUNDATION (THE MOST IMPORTANT WEEK)

Day 1
Dexie Foundation
Goal
Database fully working
Tasks
Implement final Dexie schema
Verify all tables
Test inserts manually
Output
DB initialized + stable

Day 2
Event System
Goal
Actions -> Events
Tasks
Create event creators
Deterministic IDs
Idempotency keys
Write to events + sync_queue
Output
Events stored correctly

Day 3
Reducer System
Goal
Events -> Projections
Tasks
Implement applyEvent()
Update workout_sessions
Update set_logs
Test consistency
Output
Projections always correct

Day 4
Full Simulation
Goal
Prove system works
Tasks
Simulate start workout
Simulate log sets
Simulate finish
Test replay from DB
Output
System works WITHOUT UI

Day 5
Snapshot System
Goal
Fast recovery
Tasks
Implement session snapshots
Restore active session
Output
Instant resume capability

Day 6
Workout Engine (FSM)
Goal
Control flow
Tasks
Implement FSM states
Enforce transitions
Reject invalid actions
Output
Stable workout logic

Day 7
Zustand Store
Goal
Connect engine to runtime
Tasks
Create workoutStore
Connect FSM -> events
Test state updates
Output
Working runtime engine

Week 1 Result
Working engine with no UI

Week 2
CORE PRODUCT (USER EXPERIENCE)

Day 8
Workout Entry
Tasks
Create /workout route
Connect store
Conditionally render idle vs active

Day 9
Home Screen
Tasks
TodayWorkoutCard
StartWorkoutButton
Quick Start
Goal
User can start workout instantly

Day 10
Workout HUD
Tasks
Display exercise
Show weight x reps
Log set button
Goal
Core product working

Day 11
Rest Timer
Tasks
Countdown system
Integrate with FSM

Day 12
Multi Exercise Flow
Tasks
Next exercise logic
Progression handling

Day 13
Explore Screen
Tasks
Templates list
Selection -> start workout

Day 14
Progress Screen
Tasks
Streak
Sessions count
Best lift

Week 2 Result
Full product loop working

Week 3
HARDENING + LAUNCH

Day 15
Sync Engine
Tasks
Queue processing
Batch events
Retry logic

Day 16
Offline Testing
Tests
Airplane mode
Full workout offline
Reconnect -> sync

Day 17
Edge Cases
Tests
App crash mid workout
Double taps
Resume session

Day 18
UI Polish
Tasks
Spacing
Typography
Thumb-zone fixes

Day 19
Performance
Tasks
Remove heavy queries
Optimize rendering
Test low-end device

Day 20
Final QA
Checklist
No crashes
No broken flows
No data loss

Day 21
Launch
Tasks
Deploy (Vercel)
Test production
Start onboarding users

Daily Work Structure
1. Build feature
2. Test manually
3. Break it (edge cases)
4. Fix
5. Commit

Non-Negotiable Rules
No UI before engine works
No skipping simulation
No adding random features
No touching sync early

Priority Order
ENGINE > FLOW > UI > POLISH

Critical Success Metric
Can a user complete a workout without friction?

Agent Instruction
Read /docs folder first. Follow architecture strictly.
Do not deviate from defined system rules.

Execution Gate
A day is complete only when it satisfies docs/11_definition_of_done.md.
