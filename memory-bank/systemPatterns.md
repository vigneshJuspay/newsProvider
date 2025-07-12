# System Patterns: Personalized News and Content Curator

## 1. System Architecture

The system will be designed around a central AI agent that orchestrates a series of tools to perform its tasks. The architecture is modular, allowing for the easy addition or modification of tools and capabilities.

```mermaid
graph TD
    A[User Configuration] --> B(AI Agent);
    B --> C{Content Sources};
    C --> D[WebSearch Tool];
    C --> E[RSS_Reader Tool];
    C --> F[SocialMedia Tool];
    
    subgraph Content Processing Pipeline
        G[Fetch Content] --> H[Filter & Deduplicate];
        H --> I[Summarize & Group];
    end

    D --> G;
    E --> G;
    F --> G;

    I --> J[Formatted Briefing];
    J --> K[Email Delivery];
    J --> L[Webpage Delivery];
