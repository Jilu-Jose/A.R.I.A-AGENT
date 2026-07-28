# A.R.I.A Research Digest - Comprehensive Testing Guide

This guide provides step-by-step instructions for testing all the core features, AI capabilities, and administrative controls in the A.R.I.A platform. 

Make sure both your backend (`python main.py`) and frontend (`npm run dev`) servers are running before you begin.

---

## Phase 1: Authentication & Onboarding Flow

1. **New User Registration**
   * Open the app (usually `http://localhost:5173`) and navigate to the **Sign Up** page.
   * Create a new account with a test email and password.
2. **Request Access Workflow**
   * After registering, you should be prompted to request access.
   * Select a Subscription Tier.
   * Provide a short reason for access.
   * Upload a mock PDF or Image file for your ID Verification Document.
   * Submit the form.
3. **Pending Screen**
   * You should immediately be redirected to a **Pending Approval** page indicating that an admin needs to review your account.

---

## Phase 2: Admin Dashboard

To test this phase, you will need to log in with an account that has `is_admin = True` in the database. 

1. **Accessing the Dashboard**
   * Navigate to the Admin Dashboard (click the Admin link or go to `/admin`).
2. **Review Pending Users**
   * Locate the test user you created in Phase 1 under the pending users table.
   * Click the dropdown arrow to expand their details. 
   * Click **View ID Document** to test that the file you uploaded opens correctly in a new tab.
3. **Approval Flow**
   * Click the **Payment Status** button to toggle the user from "Unverified" to "Verified".
   * Once verified, click the **Checkmark Icon** to approve the user.
   * *Optional:* Test the "Reject & Delete" (X icon) on a dummy user to ensure database cleanup works.
4. **System Status Verification**
   * Scroll down to view the **Active Agents** and **MCP Connectors** boxes.
   * Verify that the newly added scrollbar on the MCP Connectors box functions correctly when scrolling through the list of 10 MCP servers.

---

## Phase 3: Core Research Features

Log back in as the standard user you just approved (or use an existing approved account).

1. **Dashboard Overview**
   * Check the main dashboard to ensure summary statistics and recent activity widgets are rendering properly.
2. **Explore Feed**
   * Navigate to the **Explore** tab.
   * This page fetches research papers (e.g., from arXiv RSS feeds). Ensure the feed populates correctly.
   * Look for the "Trending" sidebar to ensure trend detection mock data (or live data) is visible.
3. **Library Management**
   * On the Explore page, find a paper and click to **Save** it.
   * Navigate to your **Library** tab and verify the paper appears there.
   * Test interacting with the paper (e.g., pinning, reading the summary).
4. **Agent Services (Interactive Testing)**
   Navigate to the **Agent Services** page (or use the designated buttons in the Explore/Library sections) to manually test the autonomous AI agents:
   * **Citation Network Agent:** Supply a paper ID to generate a graph of cited and referencing works, building a citation tree.
   * **Clustering Agent:** Run this on a batch of fetched RSS papers to group them into related research digest topics.
   * **Collaborator Finder:** Input a research domain or specific paper to find potential co-authors based on publication overlap.
   * **Gap Finder:** Provide a set of related papers. The agent will analyze them and highlight underexplored areas or contradictory findings.
   * **Literature Reviewer:** Enter a specific research question. The agent will synthesize multiple papers into a comprehensive mini-review.
   * **Paper Analyst:** Run on a specific saved paper to extract detailed methodology, key findings, and limitations instead of a simple summary.
   * **Recommender Agent:** Trigger this agent to look at your Library history and suggest new, unread papers from the database.
   * **Summarisation Agent:** Feed a raw abstract or paper text into this agent to generate a concise, layperson-friendly summary.
   * **Trend Detector:** Run this against the latest batch of ingested papers to detect rising keywords and breakout research topics.

---

## Phase 4: AI & RAG Chat Capabilities

This phase requires your `NVIDIA_API_KEY` (or equivalent LLM key) to be properly configured in the backend `.env` file.

1. **Chat Interface**
   * Navigate to the **Chat** page.
   * Send a general research query (e.g., "What are the latest advancements in LLMs?") to ensure the basic chat connection works.
2. **RAG (Retrieval-Augmented Generation)**
   * Ask a specific question about the paper you saved to your Library in Phase 3. 
   * The AI should use the context of your saved papers to answer accurately.
3. **Document Uploading**
   * Use the attachment icon in the chat to upload a local PDF paper.
   * Ask the AI to summarize or extract key findings from the PDF you just uploaded.

---

## Phase 5: Analytics & Personalization

1. **Analytics Dashboard**
   * Navigate to the **Analytics** tab.
   * Ensure the Recharts visualizations (bar charts, line graphs) render correctly and display your reading history/stats.
2. **Theme Testing**
   * Toggle between Light Mode and Dark Mode (usually in Settings or the Navbar). 
   * Verify that the charts and UI elements gracefully adapt their colors without breaking contrast.
3. **Settings**
   * Navigate to **Settings** and try updating your profile information or preferences.

---

## Phase 6: Backend & Background Jobs

1. **Scheduler Logs**
   * Keep an eye on your Python backend terminal.
   * Ensure that the `scheduler.py` background tasks (like periodic RSS feed fetching and clustering) are executing on their intervals without throwing exceptions. 
2. **Database Integrity**
   * If using SQLite, optionally use a tool like DB Browser for SQLite to open `data/aria.db` and verify that your users, saved papers, and chat histories are persisting correctly.
