# Election Sahayak — AI Civic Assistant

An interactive, context-aware web application designed to educate citizens about the Indian electoral process. Built for the **Hack2Skill PromptWars Challenge**.

## Overview

Election Sahayak eliminates information overload by dynamically tailoring its educational content based on the user's age and registration status. It leverages a modern glassmorphism UI and integrates four key Google Services to provide a seamless, premium experience.

## Core Features

*   **Context-Aware Routing:** The dashboard updates dynamically based on user inputs (Age, Registration Status).
    *   `< 18`: Civics 101, eligibility countdown, document preparation.
    *   `18+, Unregistered`: Form 6 walkthrough, document checklist, ERO map locator.
    *   `Registered`: Election day timeline, EVM guide, polling booth map.
*   **AI Election Helpdesk (Gemini 1.5):** An embedded chat interface grounded in ECI rules to answer edge-case electoral queries.
*   **ERO/Polling Locator (Google Maps):** Pin-code based search to locate the nearest Electoral Registration Office or polling booth.
*   **Multilingual Support (Google Cloud Translation):** Seamlessly toggle between English, Tamil, and Hindi.
*   **Deadline Manager (Google Calendar):** Add registration deadlines and election dates directly to your personal calendar.

## Technology Stack

*   **Frontend:** Vanilla HTML5, CSS3 (Custom Design System), JavaScript
*   **Backend:** Node.js, Express.js
*   **APIs:**
    *   Google Gemini API (`@google/generative-ai`)
    *   Google Maps JavaScript API
    *   Google Cloud Translation API REST endpoint
    *   Google Calendar URL Templates
*   **Deployment:** Docker, Google Cloud Run

## Getting Started (Local Development)

### 1. Prerequisites
*   Node.js (v20+)
*   Google Cloud Console Project with billing enabled
*   API Keys for Gemini, Maps, and Translate

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Sirius-ashwak/Election-sahayak.git
cd Election-sahayak
npm install
```

### 3. Configuration
Create a `.env` file in the root directory and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
PORT=8080
```

### 4. Running the App
Start the development server:
```bash
npm run dev
```
Navigate to `http://localhost:8080` in your browser.

## Deployment (Google Cloud Run)

This project is containerized and ready for deployment on Google Cloud Run.

### 1. Install Google Cloud SDK
Ensure you have the `gcloud` CLI installed and initialized (`gcloud init`).

### 2. Deploy Command
Run the following command from the project root to deploy:
```bash
gcloud run deploy election-sahayak \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,GOOGLE_MAPS_API_KEY=your_key,GOOGLE_TRANSLATE_API_KEY=your_key
```
*(Replace `your_key` with your actual API keys)*

## Repository Structure

```
election-sahayak/
├── server.js              # Express backend & API proxies
├── package.json           # Project dependencies
├── Dockerfile             # Container configuration
├── public/                # Frontend assets
│   ├── index.html         # Main SPA shell
│   ├── style.css          # Design system
│   └── app.js             # Client-side routing and logic
└── data/                  # Static datasets
    ├── ero-offices.json   # ERO location dataset
    └── i18n/              # Translation dictionaries (EN, TA, HI)
```

## Security

*   All API keys are securely managed via environment variables.
*   The Express backend acts as a secure proxy for Gemini and Translation API calls, ensuring keys are never exposed to the client.
*   Helmet.js is used to set security-related HTTP headers.

## License
This project is developed for the Hack2Skill PromptWars Challenge.
