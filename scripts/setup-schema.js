#!/usr/bin/env node
/**
 * Execute Supabase schema SQL directly using PostgreSQL connection
 * 
 * This script connects to Supabase PostgreSQL database and executes the schema SQL
 * 
 * Requirements:
 * - Database password from Supabase Dashboard → Settings → Database → Database password
 * - Add to .env.local: SUPABASE_DB_PASSWORD=<password>
 * 
 * Or you can execute manually:
 * 1. Go to https://app.supabase.com
 * 2. Project → SQL Editor → New Query
 * 3. Copy content from scripts/supabase-schema.sql
 * 4. Click Run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const schemaFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), './supabase-schema.sql');

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

const projectId = urlMatch[1];

console.log('═══════════════════════════════════════════════════════════');
console.log('📋 SUPABASE SCHEMA SETUP');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('To create the database schema, you have options:\n');
console.log('OPTION 1: Manual Setup (Recommended - no password needed)');
console.log('────────────────────────────────────────────────────────');
console.log('1. Go to https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Navigate to: SQL Editor → New Query');
console.log('4. Copy ALL content from: scripts/supabase-schema.sql');
console.log('5. Paste into the SQL editor and click "Run"\n');

console.log('OPTION 2: Automatic Setup (requires database password)');
console.log('────────────────────────────────────────────────────────');
console.log('1. Get your database password from:');
console.log('   Supabase Dashboard → Settings → Database → Database password');
console.log('2. Add to .env.local:');
console.log('   SUPABASE_DB_PASSWORD=<your_password>');
console.log('3. Run: npm run db:setup-schema\n');

console.log('Schema file location: ' + schemaFile);
console.log('Schema SQL preview (first 500 chars):');
const sql = fs.readFileSync(schemaFile, 'utf-8');
console.log('───────────────────────────────────────────────────────');
console.log(sql.substring(0, 500));
console.log('...\n');

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.log('⏳ No SUPABASE_DB_PASSWORD found in .env.local');
  console.log('   Use Option 1 (Manual Setup) above, or provide the password.\n');
  console.log('📖 After creating the schema, run:');
  console.log('   npm run db:import\n');
  process.exit(0);
}

console.log('🔐 Found SUPABASE_DB_PASSWORD, attempting automatic setup...\n');

// Try to use pg library if available
try {
  const pg = await import('pg');
  const { Client } = pg.default;

  const client = new Client({
    host: `${projectId}.db.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`🔗 Connecting to ${projectId}.db.supabase.co...\n`);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    console.log('🔅 Executing schema SQL...\n');
    await client.query(sql);

    console.log('✅ Schema created successfully!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    for (const row of result.rows) {
      console.log(`   ✓ ${row.table_name}`);
    }

    console.log('\n✅ SCHEMA SETUP COMPLETED!\n');
    console.log('📖 Next, run: npm run db:import\n');

    await client.end();
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('password')) {
      console.log('\n⚠️  Password authentication failed.');
      console.log('   Check your SUPABASE_DB_PASSWORD is correct.');
    }
    process.exit(1);
  }
} catch (err: any) {
  console.log('⚠️  pg library not installed. Installing...\n');
  console.log('For automatic schema setup, install the pg package:');
  console.log('   npm install pg\n');
  console.log('Or use the manual setup option above.\n');
  process.exit(1);
}
