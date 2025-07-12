import axios from 'axios';
import * as cheerio from 'cheerio';

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

export async function fetchNews(topic: string): Promise<NewsArticle[]> {
  console.log(`[NewsFetcher Tool] Fetching RSS feed for: ${topic}`);
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
  
  try {
    const response = await axios.get(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles: NewsArticle[] = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    $('item').each((i, el) => {
      const pubDate = new Date($(el).find('pubDate').text());
      if (pubDate > twentyFourHoursAgo) {
        articles.push({
          title: $(el).find('title').text(),
          link: $(el).find('link').text(),
          pubDate: $(el).find('pubDate').text(),
          description: $(el).find('description').text(),
          source: $(el).find('source').text(),
        });
      }
    });
    
    console.log(`[NewsFetcher Tool] Found ${articles.length} articles from the last 24 hours.`);
    return articles.slice(0, 5); // Limit to top 5
  } catch (error) {
    console.error("[NewsFetcher Tool] Error fetching or parsing RSS feed:", error);
    return [];
  }
}
