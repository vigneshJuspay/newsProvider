# Technical Context: Personalized News and Content Curator

## 1. Core Technologies

-   **Node.js**: The runtime environment for the application, chosen for its asynchronous, non-blocking I/O model, which is well-suited for this I/O-bound application.
-   **TypeScript**: The primary programming language, used for its static typing capabilities, which improve code quality, maintainability, and developer productivity.
-   **MCP (Model Context Protocol)**: A key architectural component for enabling communication between the main application and its external services (news and email).

## 2. Key Libraries and Frameworks

-   **`@juspay/neurolink`**: Used for interacting with AI models to summarize news articles.
-   **`axios`**: A promise-based HTTP client for making requests to the Google News RSS feed.
-   **`cheerio`**: A fast, flexible, and lean implementation of core jQuery designed specifically for the server to parse and manipulate the XML structure of the RSS feeds.
-   **`dotenv`**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
-   **`nodemailer`**: A module for Node.js applications to allow easy as cake email sending.
-   **`pdfkit`**: A PDF generation library for Node.js that allows for the creation of complex, multi-page documents.
-   **`ts-node`**: A TypeScript execution engine and REPL for Node.js, used to run the MCP servers directly from their TypeScript source files.
-   **`zod`**: A TypeScript-first schema declaration and validation library, likely used for ensuring the integrity of data passed between different parts of the system.

## 3. Development and Build Process

-   **Development**: The application is developed in TypeScript. The MCP servers are run directly using `ts-node`, which facilitates rapid development and testing.
-   **Build**: The `build` script in `package.json` uses the TypeScript compiler (`tsc`) to transpile the TypeScript code in `src/` into JavaScript code in `dist/`.
-   **Execution**: The `start` script first builds the project and then runs the compiled `main.js` file using Node.js.

## 4. Configuration

-   **`.env`**: This file is used to store environment-specific variables, such as API keys for the AI provider and credentials for the SMTP server. It is crucial for security and should not be committed to version control.
-   **`.mcp-config.json`**: This file defines the configuration for the MCP servers, including the command to execute them and their transport mechanism.
-   **`tsconfig.json`**: This file specifies the root files and the compiler options required to compile the TypeScript project.

## 5. Technical Constraints and Considerations

-   **Rate Limiting**: The application may be subject to rate limiting from the Google News RSS feed. The `news-fetcher` should be designed to handle such scenarios gracefully.
-   **Network Reliability**: The application's performance is dependent on the reliability of the network connections to the news feed, AI provider, and SMTP server.
-   **API Key Management**: Secure management of API keys and other credentials in the `.env` file is critical to the application's security.
-   **Scalability**: While the current architecture is modular, scaling the application would require running the MCP servers as independent, long-running processes, potentially in a containerized environment.
