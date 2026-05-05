/**
 * Precise and accurate exercise search with:
 * - Weighted scoring (name > target > secondary muscles > equipment > body part)
 * - Fuzzy matching for typos (Levenshtein distance)
 * - Word boundary matching
 * - Phrase support ("leg press" matches exact phrase)
 */

type Exercise = any;

interface SearchScore {
  exercise: Exercise;
  score: number;
  matches: string[];
}

// Simple Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if word is fuzzy match (within 2 character edits)
function isFuzzyMatch(word: string, query: string): boolean {
  if (word.includes(query)) return true; // Exact substring match
  if (query.length < 3) return false; // Don't fuzzy match very short queries
  return levenshteinDistance(word, query) <= 2;
}

// Extract all words from a field
function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

// Score a single field
function scoreField(fieldValue: string | undefined, query: string, weight: number): { score: number; matched: boolean; text: string } {
  if (!fieldValue) return { score: 0, matched: false, text: '' };

  const fieldLower = fieldValue.toLowerCase();
  const words = getWords(fieldValue);
  let score = 0;
  let matched = false;

  // 1. Exact phrase match (highest)
  if (fieldLower === query) {
    return { score: weight * 100, matched: true, text: fieldValue };
  }

  // 2. Exact phrase as substring
  if (fieldLower.includes(query)) {
    return { score: weight * 80, matched: true, text: fieldValue };
  }

  // 3. Word-level matches (weighted by position)
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Exact word match (early words score higher)
    if (word === query) {
      score = Math.max(score, weight * (70 - i * 2));
      matched = true;
    }
    // Word starts with query
    else if (word.startsWith(query)) {
      score = Math.max(score, weight * (50 - i * 2));
      matched = true;
    }
    // Fuzzy match (typo tolerance)
    else if (isFuzzyMatch(word, query)) {
      score = Math.max(score, weight * (30 - i * 2));
      matched = true;
    }
  }

  return { score, matched, text: fieldValue };
}

// Main search function
export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  if (!query || query.trim().length === 0) {
    return exercises;
  }

  const q = query.trim().toLowerCase();
  const results: SearchScore[] = [];

  for (const exercise of exercises) {
    let totalScore = 0;
    const matches: string[] = [];

    // Weight: name (highest priority)
    const nameScore = scoreField(exercise.name, q, 100);
    if (nameScore.matched) {
      totalScore += nameScore.score;
      matches.push('name');
    }

    // Weight: target muscle (high priority)
    const targetScore = scoreField(exercise.target, q, 80);
    if (targetScore.matched) {
      totalScore += targetScore.score;
      matches.push('target');
    }

    // Weight: secondary muscles (medium priority)
    if (exercise.secondaryMuscles && Array.isArray(exercise.secondaryMuscles)) {
      for (const secMuscle of exercise.secondaryMuscles) {
        const secScore = scoreField(secMuscle, q, 50);
        if (secScore.matched) {
          totalScore += secScore.score;
          if (!matches.includes('secondary')) matches.push('secondary');
          break; // Count secondary muscles as one match
        }
      }
    }

    // Weight: body part (medium priority)
    const bodyPartScore = scoreField(exercise.bodyPart, q, 40);
    if (bodyPartScore.matched) {
      totalScore += bodyPartScore.score;
      matches.push('bodyPart');
    }

    // Weight: equipment (lower priority)
    const equipmentScore = scoreField(exercise.equipment, q, 30);
    if (equipmentScore.matched) {
      totalScore += equipmentScore.score;
      matches.push('equipment');
    }

    // Only include if at least one field matched
    if (totalScore > 0) {
      results.push({
        exercise,
        score: totalScore,
        matches,
      });
    }
  }

  // Sort by score (highest first) and return exercises
  return results.sort((a, b) => b.score - a.score).map((r) => r.exercise);
}

// Simple fallback for when advanced search isn't available
export function matchesQuery(exercise: Exercise, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    exercise.name,
    exercise.bodyPart,
    exercise.target,
    exercise.equipment,
    exercise.instructions,
    ...(Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : []),
  ];
  
  for (const field of fields) {
    if (field && String(field).toLowerCase().includes(q)) {
      return true;
    }
  }
  
  return false;
}
