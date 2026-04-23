DATA MODEL
Core Tables
events (source of truth)
id
type
payload
created_at
sync_state
workout_sessions
id
user_id
status
started_at
finished_at
set_logs
id
session_id
exercise_id
weight
reps
templates
id
name
template_exercises
template_id
exercise_id
sets
reps
rest_seconds
Rule

Events generate all other tables.
Never manually edit projections.
