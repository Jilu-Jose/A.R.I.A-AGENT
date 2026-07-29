import sqlite3
import os

def migrate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "aria.db")
    
    if not os.path.exists(db_path):
        print("Database not found, nothing to migrate.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE saved_papers ADD COLUMN cover_image_url VARCHAR(1000)")
        print("Added cover_image_url column.")
    except sqlite3.OperationalError as e:
        print(f"cover_image_url error: {e}")
        
    try:
        cursor.execute("ALTER TABLE saved_papers ADD COLUMN file_size_bytes INTEGER")
        print("Added file_size_bytes column.")
    except sqlite3.OperationalError as e:
        print(f"file_size_bytes error: {e}")
        
    try:
        cursor.execute("ALTER TABLE saved_papers ADD COLUMN original_filename VARCHAR(500)")
        print("Added original_filename column.")
    except sqlite3.OperationalError as e:
        print(f"original_filename error: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
