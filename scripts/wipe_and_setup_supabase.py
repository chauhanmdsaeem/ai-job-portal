import os
import psycopg2
from dotenv import load_dotenv

def run():
    load_dotenv()
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is missing!")
        return
        
    print("Connecting to Supabase (this might take 1-2 minutes if the free tier is waking up)...")
    try:
        conn = psycopg2.connect(db_url, connect_timeout=120)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # 1. Add company columns if they don't exist
        print("Checking company profile columns...")
        for col, col_type in [("company_name", "VARCHAR"), ("company_website", "VARCHAR"), ("company_desc", "TEXT")]:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type};")
                print(f"Added {col}")
            except psycopg2.errors.DuplicateColumn:
                print(f"{col} already exists")
                
        # 2. Ask if user wants to wipe fake data
        wipe = input("\nDo you want to wipe all fake users and jobs from the database for production? (y/n): ")
        if wipe.lower() == 'y':
            print("Wiping data...")
            cursor.execute("DELETE FROM applications;")
            cursor.execute("DELETE FROM jobs;")
            cursor.execute("DELETE FROM users;")
            print("Database wiped clean!")
            
        conn.close()
        print("\nAll done!")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
