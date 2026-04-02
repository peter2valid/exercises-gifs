# 🏋️ Supabase Setup Checklist

## Status: ✅ READY TO EXECUTE

All files have been prepared for your exercises database setup. Follow these steps to complete the setup.

---

## 📋 Setup Checklist

### Phase 1: Prepare (5 minutes)
- [ ] Have your `.env.local` file with Supabase credentials
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set  
- [ ] Have internet access on the machine where you'll run the setup
- [ ] Navigate to your project directory: `/home/peter/free stufss/exercises-gifs`

### Phase 2: Install Dependencies (2 minutes)
```bash
npm install
```
- [ ] npm install completed successfully

### Phase 3: Run Database Setup (5-10 minutes)

**Choose your preferred method:**

#### Option A: Quickest (Recommended) ⭐
```bash
npm run db:setup
```
- [ ] Command started
- [ ] Setup completed successfully
- [ ] No errors in console

#### Option B: TypeScript Version
```bash
npm run db:setup:ts
```
- [ ] Command started
- [ ] Setup completed successfully

#### Option C: Manual Setup (if auto fails)

**Step 1: Create Schema**
1. [ ] Go to https://app.supabase.com
2. [ ] Select your project
3. [ ] Navigate to: SQL Editor → New Query
4. [ ] Click "New Query"
5. [ ] Open file: `scripts/supabase-schema.sql`
6. [ ] Copy ALL content from the file
7. [ ] Paste into SQL editor
8. [ ] Click "Run"
9. [ ] Wait for completion (green checkmark)

**Step 2: Import Data**
```bash
npm run db:setup
```
- [ ] Command started
- [ ] Setup completed successfully

### Phase 4: Verify Setup (3 minutes)

**In Supabase Dashboard:**
1. [ ] Go to https://app.supabase.com
2. [ ] Select your project
3. [ ] Go to Table Editor
4. [ ] Check these tables exist with data:
   - [ ] `exercises` (~1,320 rows)
   - [ ] `exercise_instructions` (~8,000+ rows)
   - [ ] `exercise_secondary_muscles` (~2,500+ rows)
   - [ ] `body_parts` (10 rows)
   - [ ] `equipment_types` (13+ rows)
   - [ ] `muscles` (25+ rows)

**View Sample Data:**
1. [ ] Click on `exercises` table
2. [ ] Verify columns exist: id, name, body_part_id, equipment_id, primary_target_id, is_active, created_at, updated_at
3. [ ] Scroll through a few rows to see exercise data
4. [ ] Click on an exercise to view its related instructions

### Phase 5: Test Your App (5 minutes)
```bash
npm run dev
```
- [ ] Dev server started on http://localhost:3000
- [ ] Open browser to http://localhost:3000
- [ ] Navigate to http://localhost:3000/scan
- [ ] See exercise list loading
- [ ] Click on exercises to view details
- [ ] Instructions display correctly

### Phase 6: Celebrate! 🎉
- [ ] Database is created ✅
- [ ] 1,324 exercises are imported ✅
- [ ] App is running with real data ✅
- [ ] Ready to build features! ✅

---

## 📊 Expected Results

After successful setup, you should see:

### Database Tables Created
```
✓ exercises (1,320+ rows)
✓ exercise_instructions (8,000+ rows)
✓ exercise_secondary_muscles (2,500+ rows)
✓ body_parts (10 rows)
✓ equipment_types (13 rows)
✓ muscles (25+ rows)
```

### Sample Data
```
Exercise: "3/4 sit-up"
ID: 0001
Body Part: waist
Equipment: body weight
Primary Target: abs
Secondary Targets: hip flexors, lower back
Instructions:
  1. Lie flat on your back with your knees bent...
  2. Place your hands behind your head...
  (5+ more steps)
```

---

## 🔄 What Happens During Setup

1. **Reference Data Setup** (30 seconds)
   - Creates 10 body parts
   - Creates 13 equipment types
   - Creates 25+ muscle references

2. **CSV Import** (1-2 minutes)
   - Parses 1,324 exercises from `exercises.csv`
   - Creates exercise records
   - Links secondary muscles
   - Stores instructions

3. **Verification** (10 seconds)
   - Counts all rows
   - Verifies data integrity
   - Reports success/issues

---

## ⚠️ Troubleshooting

### Problem: "fetch failed"
**Cause:** Network connection issue
**Solution:** 
- Check internet connection
- Try from a different network/machine
- Use manual setup option (script in dashboard)

### Problem: "table does not exist"
**Cause:** Schema wasn't created
**Solution:**
- First create schema using Option C (Manual Setup)
- Then run data import

### Problem: "Unknown body part" warnings
**Cause:** CSV has body parts not in reference data
**Solution:**
- This is normal, script skips unmapped exercises
- Check `SETUP_SUMMARY.md` for list of supported body parts

### Problem: Script is slow
**Expected behavior:**
- Takes 1-2 minutes for full import
- Shows progress every 100 exercises
- Can safely interrupt with Ctrl+C

### Problem: Import partially succeeded
**Solution:**
- Run the script again (uses upsert, idempotent)
- Check logs for specific errors
- See `SETUP_GUIDE_COMPLETE.md` for details

---

## 📚 Documentation

Read these files for more information:

1. **`SETUP_SUMMARY.md`** - Complete overview
2. **`SETUP_GUIDE_COMPLETE.md`** - Detailed guide with all details
3. **`SETUP_READY.md`** - Quick start guide
4. **`scripts/supabase-schema.sql`** - Raw SQL schema

---

## 🎯 Next Steps After Setup

1. **Explore the Data**
   - Check Supabase Table Editor
   - Try GraphQL queries (if enabled)

2. **Build Features**
   - Create training programs
   - Add exercise filtering
   - Build workout plans
   - Add user favorites/history

3. **Optimize**
   - Add caching for performance
   - Set up real-time subscriptions
   - Create custom views

4. **Deploy**
   - Test on production database
   - Monitor performance
   - Set up automated backups

---

## 📞 Help & Support

### Scripts Available
- `npm run db:setup` - Full setup (Node.js)
- `npm run db:setup:ts` - Full setup (TypeScript)
- `npm run db:setup:schema` - Schema only
- `npm run db:import` - Data import only

### Files to Check
- `.env.local` - Your credentials
- `exercises.csv` - Your exercise data
- `scripts/supabase-schema.sql` - Database schema
- `scripts/setup.js` - Setup script

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Exercises API Source](https://rapidapi.com/api-sports/api/api-sports-exercises)

---

## ✅ Completion Checklist

- [ ] All phases completed
- [ ] Database has all tables and data
- [ ] App connects to database
- [ ] Exercises display in app
- [ ] No errors in console
- [ ] Ready to build features!

---

**Status:** 🚀 READY TO GO!

**Start with:** `npm run db:setup`

Good luck! 🏋️
