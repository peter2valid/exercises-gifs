# 🚀 Supabase Setup - File Navigation Guide

## Start Here 👈

### ✅ First Time? Read This:
- **`SETUP_CHECKLIST.md`** - Step-by-step checklist to complete setup
  - Start here if you want a clear action plan
  - Contains phase-by-phase guidance
  - Includes troubleshooting

### 🏃 Quick Start:
- **`SETUP_READY.md`** - Quick reference guide  
  - What has been created
  - How to run setup
  - What gets imported
  - 2-minute read

### 📚 Full Documentation:
- **`SETUP_GUIDE_COMPLETE.md`** - Complete reference
  - Detailed explanations
  - Database schema documentation
  - CSV format details
  - Extensive troubleshooting

### 📊 Overview:
- **`SETUP_SUMMARY.md`** - Comprehensive summary
  - What files were created
  - What data is imported
  - How it all works
  - Next steps after setup

---

## 🛠️ Setup Scripts

### Recommended: Pure Node.js (no compilation)
```bash
npm run db:setup
# or
node scripts/setup.js
```
- **File:** `scripts/setup.js`
- **Type:** JavaScript (ES modules)
- **Best for:** Maximum compatibility

### Alternative: TypeScript
```bash
npm run db:setup:ts
# or
npx ts-node scripts/setup-simple.ts
```
- **File:** `scripts/setup-simple.ts`
- **Type:** TypeScript
- **Best for:** Developers who prefer type safety

### Schema Only:
```bash
npm run db:setup:schema
node scripts/setup-schema.js
```
- **File:** `scripts/setup-schema.js`
- **Purpose:** Create schema without importing data

### Data Import Only:
```bash
npm run db:import
npx ts-node scripts/import-exercises-normalized.ts
```
- **File:** `scripts/import-exercises-normalized.ts`
- **Purpose:** Import data after schema exists

---

## 📄 Database Schema

### SQL Schema File:
- **`scripts/supabase-schema.sql`**
  - Raw SQL for all table definitions
  - Create indexes
  - Row Level Security policies
  - Reference data inserts
  - Use this for manual setup in Supabase dashboard

---

## 📋 Your Data

### CSV File:
- **`exercises.csv`** (1,324 rows)
  - Exercise data source
  - Contains: name, body part, equipment, target, secondary muscles, instructions
  - Automatically imported by setup scripts

---

## 💾 Configuration

### Environment:
- **`.env.local`** (you created this)
  - `NEXT_PUBLIC_SUPABASE_URL` ✓
  - `SUPABASE_SERVICE_ROLE_KEY` ✓
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓

### Dependencies:
- **`package.json`** (updated with scripts)
  - Added: `db:setup`, `db:setup:ts`, `db:setup:schema`, `db:import`
  - All dependencies already installed

---

## 📊 Expected Output

### After Running Setup:

**Console Output:**
```
═══════════════════════════════════════════════════════════
🏋️  SUPABASE EXERCISES DATABASE SETUP
═══════════════════════════════════════════════════════════

📋 Setting up reference data...
✓ Body parts: 10 references
✓ Equipment: 13 types
✓ Muscles: 25+ references

🚀 Starting exercise import...
✓ Parsed 1324 exercises from CSV
✓ 1324 unique exercises

  [50%] 650/1324 exercises (650 OK, 0 skipped) [45s]...
✓ Import completed in 95s

📊 Verifying data...
   Tables created:
   ✓ exercises
   ✓ exercise_instructions
   ✓ exercise_secondary_muscles
   ✓ body_parts
   ✓ equipment_types
   ✓ muscles

📈 Data Summary:
   • Total Exercises: 1320
   • Total Instructions: 8100
   • Total Secondary Muscles: 2500

═══════════════════════════════════════════════════════════
✅ DATABASE SETUP COMPLETED SUCCESSFULLY!
═══════════════════════════════════════════════════════════
```

### In Supabase Dashboard:
- 6 new tables created
- ~13,000 total rows across all tables
- All data visible in Table Editor

---

## 🎯 Getting Started

### Quick Path (5 minutes):
1. Read: `SETUP_READY.md`
2. Run: `npm run db:setup`
3. Wait: ~1-2 minutes
4. Verify: Check Supabase dashboard

### Detailed Path (15 minutes):
1. Read: `SETUP_CHECKLIST.md`
2. Follow: Step-by-step instructions
3. Execute: Setup with checkmarks
4. Test: Run `npm run dev`

### Manual Path (20 minutes):
1. Read: `SETUP_GUIDE_COMPLETE.md`
2. Execute: `scripts/supabase-schema.sql` in dashboard
3. Run: `npm run db:setup`
4. Review: Full documentation

---

## ❓ FAQ

**Q: Which script should I run?**
A: Start with `npm run db:setup` (easiest, no TypeScript needed)

**Q: Do I need internet access?**
A: Yes, need to reach Supabase servers

**Q: How long does it take?**
A: 5-10 minutes total (setup + import)

**Q: What if it fails?**
A: Check `SETUP_CHECKLIST.md` troubleshooting section

**Q: Can I run it multiple times?**
A: Yes, safe to re-run (uses upsert/idempotent)

**Q: Do I need a database password?**
A: No, service role key is sufficient

**Q: What data gets imported?**
A: 1,324 exercises + 8,000+ instructions + 2,500+ muscle relationships

---

## 📖 Documentation Map

```
Start Here
  ├── SETUP_CHECKLIST.md ⭐ (action-oriented)
  ├── SETUP_READY.md (quick reference)
  ├── SETUP_SUMMARY.md (overview)
  └── SETUP_GUIDE_COMPLETE.md (detailed)

Scripts to Run
  ├── npm run db:setup (recommended)
  ├── npm run db:setup:ts (alternative)
  ├── npm run db:setup:schema (schema only)
  └── npm run db:import (data import only)

Raw Files
  ├── scripts/setup.js (Node.js setup)
  ├── scripts/setup-simple.ts (TypeScript setup)
  ├── scripts/setup-schema.js (schema creation)
  ├── scripts/supabase-schema.sql (raw SQL)
  └── exercises.csv (exercise data)
```

---

## ✨ What You Get

✅ Automated setup scripts (2 versions)
✅ Complete SQL schema file
✅ Data import logic
✅ Error handling & verification
✅ Comprehensive documentation
✅ Troubleshooting guides
✅ npm scripts for easy execution
✅ Everything needed for production use

---

## 🚀 Next Action

**Choose your path:**

1. **Fastest:** `npm run db:setup` → Check dashboard
2. **Guided:** Read `SETUP_CHECKLIST.md` → Follow steps
3. **Detailed:** Read `SETUP_GUIDE_COMPLETE.md` → Do manual setup

---

**You're all set! 🚀**

Pick any of the above and you'll have your database running in minutes.
