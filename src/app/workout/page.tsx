import WorkoutPageClient from './WorkoutPageClient';

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ exerciseId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return <WorkoutPageClient initialExerciseId={resolvedSearchParams.exerciseId ?? ''} />;
}
