import { fetchNews, NewsArticle } from '../../tools/news-fetcher';
import * as dotenv from 'dotenv';

dotenv.config();

interface FetchNewsParams {
  topic: string;
}

class NewsMcpServer {
  async fetchNews({ topic }: FetchNewsParams): Promise<{ success: boolean; message: string; articles?: NewsArticle[] }> {
    try {
      console.log(`[NewsMCP Server] Fetching news for topic: ${topic}`);
      const articles = await fetchNews(topic);
      
      if (articles.length === 0) {
        return {
          success: false,
          message: `No articles found for topic: ${topic}`,
        };
      }
      
      return {
        success: true,
        message: `Successfully fetched ${articles.length} articles for topic: ${topic}`,
        articles,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error fetching news',
      };
    }
  }

  async listTools() {
    return [{
      name: 'fetchNews',
      description: 'Fetches recent news articles for a specified topic',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to fetch news articles for' },
        },
        required: ['topic'],
      },
    }];
  }
}

async function handleCommand() {
  const args = process.argv.slice(2);
  const toolName = args[0];
  const paramsFlagIndex = args.indexOf('--params');
  let params = {};

  if (paramsFlagIndex !== -1 && args[paramsFlagIndex + 1]) {
    try {
      params = JSON.parse(args[paramsFlagIndex + 1]);
    } catch (e) {
      console.error("Error parsing params JSON");
      process.exit(1);
    }
  }

  const server = new NewsMcpServer();

  let result;
  if (toolName === 'fetchNews') {
    result = await server.fetchNews(params as FetchNewsParams);
  } else if (toolName === 'listTools') {
    result = await server.listTools();
  } else {
    result = { success: false, message: "Unknown tool" };
  }

  // Use JSON markers to clearly identify where JSON begins and ends
  console.log("---JSON_START---");
  console.log(JSON.stringify(result));
  console.log("---JSON_END---");
  process.exit(0);
}

handleCommand();