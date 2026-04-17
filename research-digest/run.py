
import sys
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import create_app
app = create_app()
if __name__ == "__main__":
    print()
    print("  ◈ A.R.I.A — Autonomous Research Intelligence Agent")
    print("  ──────────────────────────────────────────────────")
    print("  Open http://localhost:5000 to access the app")
    print("  Press Ctrl+C to stop the server")
    print()
    app.run(host="0.0.0.0", port=5000, debug=False)
