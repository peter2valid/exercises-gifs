import { cp, lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'child_process';

const root = process.cwd();
const sourceDir = path.join(root, 'assets');
const targetDir = path.join(root, 'public', 'exercise-media');

async function pathType(p) {
  try {
    const stat = await lstat(p);
    if (stat.isSymbolicLink()) return 'symlink';
    if (stat.isDirectory()) return 'directory';
    return 'file';
  } catch {
    return 'missing';
  }
}

async function main() {
  const sourceType = await pathType(sourceDir);
  if (sourceType !== 'directory') {
    throw new Error(`Source assets directory missing: ${sourceDir}`);
  }

  const mp4SourceDir = path.join(root, 'assets_mp4');
  const mp4SourceType = await pathType(mp4SourceDir);

  const targetType = await pathType(targetDir);
  if (targetType !== 'missing') {
    await rm(targetDir, { recursive: true, force: true });
  }

  await mkdir(path.dirname(targetDir), { recursive: true });
  
  // Copy GIFs
  await cp(sourceDir, targetDir, { recursive: true });
  
  // Copy MP4s if they exist
  if (mp4SourceType === 'directory') {
    console.log(`Copying MP4s from ${mp4SourceDir} to ${targetDir}...`);
    await cp(mp4SourceDir, targetDir, { recursive: true });
  }

  console.log(`Prepared public media at ${targetDir}`);

  // Generate posters for fast lazy-loading on slow networks
  try {
    console.log('Generating exercise posters for slow networks...');
    execSync('node scripts/generate-posters.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Poster generation skipped or incomplete (non-critical):', error.message);
  }
}

main().catch((error) => {
  console.error('Failed to prepare public media:', error.message);
  process.exit(1);
});
