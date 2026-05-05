#!/usr/bin/env node

/**
 * Generate low-quality JPG posters from GIFs as placeholders.
 * This reduces initial network burden dramatically:
 * - GIF: 250-300KB each
 * - Poster JPG: 5-15KB each
 * 
 * Run: node scripts/generate-posters.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '../assets');
const POSTERS_DIR = path.join(__dirname, '../public/exercise-posters');

// Ensure posters directory exists
if (!fs.existsSync(POSTERS_DIR)) {
  fs.mkdirSync(POSTERS_DIR, { recursive: true });
  console.log(`✓ Created ${POSTERS_DIR}`);
}

// Get all GIF files
const gifFiles = fs
  .readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith('.gif'))
  .sort((a, b) => {
    const numA = parseInt(a.split('.')[0], 10);
    const numB = parseInt(b.split('.')[0], 10);
    return numA - numB;
  });

console.log(`Found ${gifFiles.length} GIF files. Generating posters...\n`);

let generated = 0;
let skipped = 0;

gifFiles.forEach((gifFile, idx) => {
  const gifPath = path.join(ASSETS_DIR, gifFile);
  const posterName = gifFile.replace('.gif', '.jpg');
  const posterPath = path.join(POSTERS_DIR, posterName);

  // Skip if poster already exists
  if (fs.existsSync(posterPath)) {
    skipped++;
    return;
  }

  try {
    // Extract first frame and convert to low-quality JPG
    // -vframes 1: extract 1 frame
    // -q:v 8: quality 8 (lower = better, but slower; 8 = ~70% quality, ~10-15KB)
    execSync(
      `ffmpeg -i "${gifPath}" -vframes 1 -q:v 8 -y "${posterPath}" 2>&1 | grep -E "(frame|error)" || true`,
      { encoding: 'utf8' }
    );

    const posterSize = fs.statSync(posterPath).size;
    const posterSizeKB = (posterSize / 1024).toFixed(1);
    generated++;

    if ((idx + 1) % 50 === 0 || idx === gifFiles.length - 1) {
      console.log(`✓ [${idx + 1}/${gifFiles.length}] Generated ${gifFile} → ${posterName} (${posterSizeKB} KB)`);
    }
  } catch (error) {
    console.error(`✗ Failed to generate poster for ${gifFile}:`, error.message);
  }
});

console.log(`\n✓ Complete: ${generated} new posters generated, ${skipped} already existed.`);
console.log(`Posters saved to: ${POSTERS_DIR}`);
