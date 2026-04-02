#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { lookup as lookupMime } from 'mime-types';
import fs from 'node:fs/promises';
import path from 'node:path';

loadEnv({ path: '.env.local', override: true });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyVideos = args.includes('--videos');
const onlyGifs = args.includes('--gifs');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

function getSourceMappings() {
  const mappings = [];

  if (!onlyGifs) {
    mappings.push({
      sourceDir: path.resolve('assets_mp4'),
      extensions: new Set(['.mp4']),
      targetPrefix: 'exercises/',
    });
  }

  if (!onlyVideos) {
    mappings.push({
      sourceDir: path.resolve('assets'),
      extensions: new Set(['.gif']),
      targetPrefix: 'gifs/',
    });
  }

  return mappings;
}

async function listFilesRecursive(dir) {
  const out = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }

  await walk(dir);
  return out;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function uploadOne(client, bucket, filePath, key, dry) {
  const contentType = lookupMime(filePath) || 'application/octet-stream';

  if (dry) {
    return { ok: true, dry: true, key };
  }

  const body = await fs.readFile(filePath);

  const uploader = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  await uploader.done();
  return { ok: true, dry: false, key };
}

async function main() {
  requireEnv('R2_ACCOUNT_ID', R2_ACCOUNT_ID);
  requireEnv('R2_BUCKET_NAME', R2_BUCKET_NAME);
  requireEnv('R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID);
  requireEnv('R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY);

  const mappings = getSourceMappings();

  if (mappings.length === 0) {
    throw new Error('No upload mode selected. Remove flags or choose one of --videos / --gifs.');
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const uploadJobs = [];

  for (const mapping of mappings) {
    let files = [];
    try {
      files = await listFilesRecursive(mapping.sourceDir);
    } catch {
      console.warn(`Skipping missing directory: ${mapping.sourceDir}`);
      continue;
    }

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!mapping.extensions.has(ext)) continue;

      const fileName = path.basename(filePath);
      const key = `${mapping.targetPrefix}${fileName}`;
      uploadJobs.push({ filePath, key });
    }
  }

  if (uploadJobs.length === 0) {
    console.log('No files found to upload.');
    return;
  }

  if (limit !== null && Number.isFinite(limit) && limit > 0) {
    uploadJobs.splice(limit);
  }

  console.log(`Preparing to upload ${uploadJobs.length} files to bucket ${R2_BUCKET_NAME}`);
  console.log(`Endpoint: ${endpoint}`);
  if (dryRun) {
    console.log('Dry run mode enabled - no files will be uploaded.');
  }

  let success = 0;
  let failed = 0;

  const batches = chunk(uploadJobs, 8);
  for (const [index, batch] of batches.entries()) {
    const results = await Promise.allSettled(
      batch.map((job) => uploadOne(client, R2_BUCKET_NAME, job.filePath, job.key, dryRun))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        success += 1;
      } else {
        failed += 1;
        console.error(`Failed: ${result.reason?.message ?? result.reason}`);
      }
    }

    const completed = Math.min((index + 1) * 8, uploadJobs.length);
    console.log(`Progress: ${completed}/${uploadJobs.length} (ok: ${success}, failed: ${failed})`);
  }

  console.log('Upload complete.');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Upload failed: ${error.message}`);
  process.exit(1);
});
