#!/usr/bin/env python3
"""
Execute Supabase schema SQL directly using PostgreSQL connection
"""

import os
import sys
import re
from pathlib import Path

# Try to import psycopg2
try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not found. Installing...")
    os.system("pip install psycopg2-binary python-dotenv")
    import psycopg2

from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL:
    print("❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local")
    sys.exit(1)

# Extract PostgreSQL connection details from Supabase URL
# URL format: https://project-id.supabase.co
match = re.match(r'https://([^.]+)\.supabase\.co', SUPABASE_URL)
if not match:
    print("❌ Invalid SUPABASE_URL format")
    sys.exit(1)

project_id = match.group(1)

# Supabase PostgreSQL connection details
DB_HOST = f"{project_id}.db.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = os.getenv('SUPABASE_DB_PASSWORD')

# If password not in env, ask user or use service role key
if not DB_PASSWORD:
    print("⚠️  SUPABASE_DB_PASSWORD not found in .env.local")
    print("    You need the database password. Options:")
    print("    1. Add it to .env.local: SUPABASE_DB_PASSWORD=<password>")
    print("    2. Or get it from Supabase Dashboard → Settings → Database")
    DB_PASSWORD = input("\n   Enter PostgreSQL password: ")
    
    if not DB_PASSWORD:
        print("❌ Password required")
        sys.exit(1)

# Read schema SQL from file
schema_file = Path(__file__).parent / "supabase-schema.sql"
if not schema_file.exists():
    print(f"❌ Schema file not found: {schema_file}")
    sys.exit(1)

with open(schema_file) as f:
    schema_sql = f.read()

print("═" * 60)
print("📋 SUPABASE SCHEMA CREATION")
print("═" * 60)
print(f"\n🔗 Connecting to: {DB_HOST}\n")

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode='require'
    )
    
    cursor = conn.cursor()
    
    print("✅ Connected to PostgreSQL\n")
    print("🔅 Executing schema SQL...\n")
    
    # Execute the schema SQL
    cursor.execute(schema_sql)
    conn.commit()
    
    print("✅ Schema created successfully!\n")
    
    # Verify tables were created
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    
    tables = cursor.fetchall()
    print("📊 Tables created:")
    for table in tables:
        print(f"   ✓ {table[0]}")
    
    print("\n✅ SCHEMA SETUP COMPLETED!\n")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Connection failed: {e}")
    print("\n   Troubleshooting:")
    print("   1. Check your database password is correct")
    print("   2. Ensure you have network access to Supabase")
    print("   3. Check that the project ID is correct")
    sys.exit(1)
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
    print(f"\n   Details: {e.diag.message_primary if hasattr(e, 'diag') else str(e)}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
