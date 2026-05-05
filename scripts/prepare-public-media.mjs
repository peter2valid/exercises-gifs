import { cp, lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

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

  const targetType = await pathType(targetDir);
  if (targetType !== 'missing') {
    await rm(targetDir, { recursive: true, force: true });
  }

  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });

  console.log(`Prepared public media at ${targetDir}`);
}

main().catch((error) => {
  console.error('Failed to prepare public media:', error.message);
  process.exit(1);
});
