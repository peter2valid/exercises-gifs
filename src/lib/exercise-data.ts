type ExerciseLike = {
  id?: string | number;
  name?: unknown;
  body_part?: unknown;
  bodyPart?: unknown;
  target_muscles?: unknown;
  target?: unknown;
  equipment?: unknown;
  instructions?: unknown;
  video_url?: unknown;
  gif_url?: unknown;
};

export function getExerciseBodyPart(exercise: ExerciseLike): string {
  return String(exercise.body_part ?? exercise.bodyPart ?? '').trim();
}

export function getExerciseTargetMuscles(exercise: ExerciseLike): string {
  return String(exercise.target_muscles ?? exercise.target ?? '').trim();
}

export function getExerciseInstructions(rawInstructions: unknown): string[] {
  if (Array.isArray(rawInstructions)) {
    return rawInstructions.map((value) => String(value).trim()).filter(Boolean);
  }

  if (typeof rawInstructions === 'string') {
    const trimmed = rawInstructions.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((value) => String(value).trim()).filter(Boolean);
        }

        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).map((value) => String(value).trim()).filter(Boolean);
        }
      } catch {
        // Fall back to line-based parsing below.
      }
    }

    return trimmed
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (rawInstructions && typeof rawInstructions === 'object') {
    return Object.values(rawInstructions).map((value) => String(value).trim()).filter(Boolean);
  }

  return [];
}

export function getExerciseVideoSrc(exercise: ExerciseLike, r2PublicUrl: string): string {
  const videoUrl = String(exercise.video_url ?? exercise.gif_url ?? '').trim();
  if (videoUrl && !videoUrl.includes('undefined')) {
    return videoUrl;
  }

  const cleanId = String(exercise.id ?? '').padStart(4, '0');
  if (!r2PublicUrl) {
    return '';
  }

  return `${r2PublicUrl}/exercises/${cleanId}.mp4`;
}