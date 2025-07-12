# Personalized News and Content Curator (NeuroLink)

This application is a personalized intelligence analyst that sifts through the internet to find content relevant to your interests.

## Current Status

The project is set up with a basic structure. It uses TypeScript and the `@juspay/neurolink` library to connect to AI services. A placeholder `WebSearch` tool is in place, and the application can summarize articles using an AI provider.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your Google AI API key:
    ```
    GOOGLE_AI_API_KEY="YOUR_API_KEY"
    ```

3.  **Run the Application:**
    ```bash
    npm start
    ```

This will start the application, which will then fetch and summarize articles on the topic of "Artificial Intelligence".
