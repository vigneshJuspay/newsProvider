# NeuroLink Personalized News Provider

A powerful news aggregation and delivery system that uses AI to curate personalized news briefings on topics of your interest. The application fetches news articles, generates AI-powered summaries, creates professional PDF reports, and can deliver them directly to your email inbox.

## Features

- **Personalized News Curation**: Specify multiple topics of interest to receive customized news briefings
- **AI-Powered Summaries**: Utilizes NeuroLink's AI capabilities to create concise, informative article summaries
- **PDF Generation**: Creates professionally formatted PDF documents with article summaries and metadata
- **Email Delivery**: Uses Model Context Protocol (MCP) to send the PDF briefings directly to your inbox
- **Multi-Provider Support**: Leverages NeuroLink's provider-agnostic approach for AI capabilities

## Architecture

- Built on the NeuroLink platform for advanced AI capabilities
- Uses the Model Context Protocol (MCP) for email functionality
- Fetches news from multiple sources via RSS feeds
- Generates PDF documents with PDFKit

## Prerequisites

- Node.js (v14 or later)
- TypeScript
- A valid API key for one of the supported AI providers

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd newsProvider
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create or edit a `.env` file in the root directory:
   ```
   # AI API Keys (use one or more)
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_AI_API_KEY=your-google-ai-api-key

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

   Note: For Gmail, you may need to use an App Password instead of your regular password.

## Usage

1. **Run the application:**
   ```bash
   npm start
   ```

2. **Follow the prompts:**
   - Enter your topics of interest (comma-separated)
   - Enter the email address to receive the news briefing

3. **View the results:**
   - A PDF file will be generated locally
   - If email is configured correctly, the PDF will be sent to the specified email address

## Implementation Details

### Components

- **News Fetcher**: Retrieves recent news articles from Google News RSS feeds
- **AI Provider**: Uses NeuroLink to generate concise summaries of news articles
- **PDF Generator**: Creates professional-looking PDFs with article summaries and metadata
- **MCP Email Server**: Custom Model Context Protocol implementation for sending emails with attachments

### MCP Integration

The application demonstrates advanced integration with NeuroLink's Model Context Protocol:

1. Registers a custom email MCP server at runtime
2. Provides tool definitions for email capabilities
3. Executes MCP tools to send emails with PDF attachments

## Troubleshooting

- If the email functionality doesn't work, check your SMTP settings and credentials in the `.env` file
- Make sure you have a valid API key for at least one AI provider
- If you're using Gmail, you may need to generate an App Password

## License

This project is licensed under the MIT License - see the LICENSE file for details.
