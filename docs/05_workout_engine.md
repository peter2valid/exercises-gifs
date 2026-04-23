WORKOUT ENGINE (FSM)
States
idle
active
resting
finished
abandoned
Transitions
startWorkout -> active
logSet -> resting
endRest -> active
finishWorkout -> finished
Rules
Invalid actions are rejected
Engine controls all transitions
