export const WORKOUT_EVENT_TYPES = [
  'SESSION_STARTED',
  'SET_LOGGED',
  'REST_STARTED',
  'SESSION_COMPLETED',
  'SET_EDITED',
  'SET_DELETED',
] as const;

export type WorkoutEventType = (typeof WORKOUT_EVENT_TYPES)[number];

export type CreateEventInput = {
  type: WorkoutEventType;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};

export function createEventInput(input: CreateEventInput): CreateEventInput {
  return {
    ...input,
    idempotencyKey: input.idempotencyKey ?? '',
  };
}
