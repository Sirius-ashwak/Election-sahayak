# Product Requirements Document (PRD)
## Project: Election Sahayak (AI Civic Assistant)
**Status:** In Development (Hack2Skill PromptWars Challenge)
**Platform:** Google Antigravity

---

### 1. Executive Summary
Election Sahayak is an interactive, context-aware web application designed to educate citizens about the electoral process. Built using Google Antigravity, the app eliminates information overload by dynamically tailoring its educational content based on the user’s age and registration status. 

### 2. Objectives & Hackathon Alignment
*   **Primary Goal:** Simplify voter education and registration processes through an interactive, step-by-step UI.
*   **Hackathon Goal:** Strictly adhere to the <10 MB repository limit and single-branch rule while demonstrating advanced use of Google Services and maintaining high code quality and security.

### 3. Target Personas
1.  **The Future Voter (Age < 18):** Needs civic education and a timeline for when they become eligible.
2.  **The Unregistered Citizen (Age 18+):** Needs step-by-step guidance on filling out Form 6 and finding their local Electoral Registration Office (ERO).
3.  **The Registered Voter:** Needs to know election dates, polling booth locations, and Election Day procedures (e.g., EVM usage).

---

### 4. Core Features & Google Services Integration

#### 4.1. Context-Aware Routing Engine
*   **Description:** A sidebar inputs user age and status. The main dashboard updates dynamically to show only relevant information.
*   **Logic:**
    *   `< 18`: Display "Civics 101" and eligibility countdown.
    *   `18+, Unregistered`: Display interactive Voter Registration Checklist (ID proofs, Form 6 link).
    *   `Registered`: Display Polling Day instructions and checklist.

#### 4.2. AI Election Helpdesk (Google Gemini API)
*   **Description:** An embedded chat interface capable of answering edge-case electoral queries (e.g., address changes, lost IDs).
*   **Service:** `google.generativeai` (Gemini 1.5).

#### 4.3. Polling / ERO Locator (Google Maps Platform)
*   **Description:** Users input their Pin Code (e.g., a Chennai area code) to view an embedded map showing the nearest Electoral Registration Office or polling booth.
*   **Service:** Google Maps API.

#### 4.4. Multilingual Accessibility (Google Cloud Translation)
*   **Description:** A dropdown to toggle the app's language between English, Tamil, and Hindi to ensure inclusive design.
*   **Service:** Google Cloud Translation API.

#### 4.5. Deadline Manager (Google Calendar)
*   **Description:** Dynamically generated URL links that allow users to add voter registration deadlines or election dates directly to their personal calendar.
*   **Service:** Google Calendar URL Templates.

---

### 5. Technical Architecture
*   **Frontend & Logic:** Python with Streamlit.
*   **IDE / Agentic Platform:** Google Antigravity.
*   **Version Control:** Git (GitHub, single `main` branch).
*   **Security:** API Keys managed via local `.env` (ignored via `.gitignore`) and securely deployed via Streamlit Secrets.

---

### 6. Evaluation Criteria Checklist
*   [ ] **Code Quality:** PEP-8 compliant Python code, clean modular functions for each UI section.
*   [ ] **Security:** `.gitignore` active. No hardcoded API keys. 
*   [ ] **Efficiency:** Use of Streamlit caching (`@st.cache_data`) for translated text and Maps API calls to minimize latency and API costs.
*   [ ] **Testing:** Manual edge-case testing via Antigravity's `/test` agent.
*   [ ] **Accessibility:** Multilingual support (Tamil/Hindi), ARIA-compatible markdown rendering, and high-contrast UI defaults in Streamlit.
*   [ ] **Google Services:** Gemini, Maps, Translate, and Calendar integrated seamlessly into the user journey.

---

### 7. Constraints & Assumptions
*   **Constraint:** Project size must remain under 10 MB. No large assets (images/videos) will be hosted in the repo; external CDNs or Google tools will be used.
*   **Assumption:** The user is connected to the internet to access Google APIs.
