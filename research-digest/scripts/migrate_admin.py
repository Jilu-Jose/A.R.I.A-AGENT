import sqlite3
import os

def migrate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "digest.db")
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("role", "VARCHAR(50)"),
        ("payment_tier", "INTEGER DEFAULT 1"),
        ("payment_status", "BOOLEAN DEFAULT 0"),
        ("verification_doc_path", "VARCHAR(500)"),
        ("is_approved", "BOOLEAN DEFAULT 0"),
        ("is_admin", "BOOLEAN DEFAULT 0")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    # Make the current user an admin
    cursor.execute("UPDATE users SET is_admin = 1, is_approved = 1 WHERE email = 'jilupjose111@gmail.com'")
    conn.commit()
    print("Promoted jilupjose111@gmail.com to Admin.")
    
    conn.close()

if __name__ == "__main__":
    migrate()
