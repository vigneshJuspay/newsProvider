import { createBestAIProvider } from "@juspay/neurolink";
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';
import { NewsArticle, fetchNews } from "../tools/news-fetcher";
import { z } from 'zod';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log("🌟 NeuroLink Personalized Content Curator 🌟");
  console.log("------------------------------------------");

  try {
    const aiProvider = await createBestAIProvider();

    rl.question('Enter your topics of interest (comma separated, e.g., "AI safety, climate change, space exploration"): ', async (topicsInput) => {
      if (!topicsInput.trim()) {
        console.log("No topics entered. Exiting.");
        rl.close();
        return;
      }
      
      const topics = topicsInput.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
      
      if (topics.length === 0) {
        console.log("No valid topics entered. Exiting.");
        rl.close();
        return;
      }
      
      console.log(`\n🔍 Generating your personalized news briefing for ${topics.length} topics...`);
      
      let html = `
        <html>
          <head>
            <title>Multi-Topic News Briefing</title>
            <style>
              body { font-family: sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
              .topic-section { margin-bottom: 3em; border-bottom: 2px solid #666; padding-bottom: 1em; }
              .article { margin-bottom: 2em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
              h1 { color: #333; text-align: center; margin-bottom: 1.5em; }
              h2 { color: #444; margin-bottom: 0.5em; }
              h3 { color: #555; }
              .meta { font-style: italic; color: #555; margin-bottom: 10px; }
              .topic-title { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
              .summary { line-height: 1.5; }
              a { color: #0066cc; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .date { margin-top: 0; text-align: center; color: #666; font-style: italic; }
            </style>
          </head>
          <body>
            <h1>Multi-Topic News Briefing</h1>
            <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      `;
      
      const allArticlesCount = { total: 0 };
      
      for (const topic of topics) {
        console.log(`\n📰 Fetching news for topic: ${topic}...`);
        const articles = await fetchNews(topic);
        
        if (!articles || articles.length === 0) {
          console.log(`⚠️ No articles found for topic: ${topic}. Moving to next topic.`);
          continue;
        }
        
        allArticlesCount.total += articles.length;
        
        html += `
          <div class="topic-section">
            <h2 class="topic-title">📌 ${topic}</h2>
        `;

        for (const article of articles) {
          console.log(`  • Processing article: ${article.title.substring(0, 50)}...`);
          
          const summary = await aiProvider.streamText({
            prompt: `Summarize the following article in one concise, informative paragraph of about 4-5 sentences.
              Make the summary valuable to a reader scanning for important information.
              It should be like you are a quick news reporter.
              
              Title: ${article.title}
              Description: ${article.description}
            `
          });

          let summaryText = "";
          if (summary && summary.textStream) {
            for await (const chunk of summary.textStream) {
              summaryText += chunk;
            }
          }

          html += `
            <div class="article">
              <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
              <div class="meta">
                <span>Source: ${article.source}</span> | 
                <span>Published: ${new Date(article.pubDate).toLocaleString()}</span>
              </div>
              <p class="summary">${summaryText}</p>
            </div>
          `;
        }

        html += `</div>`;
      }

      if (allArticlesCount.total === 0) {
        console.log("\n⚠️ No articles found for any of the topics. Try different topics or check your connection.");
        rl.close();
        return;
      }

      html += `
          </body>
        </html>
      `;
      
      const fileName = `news-briefing-${Date.now()}.html`;
      const filePath = path.join(process.cwd(), fileName);
      fs.writeFileSync(fileName, html);
      
      console.log(`\n✅ Your multi-topic news briefing is ready!`);
      console.log(`📄 File saved to: ${fileName}`);
      console.log(`📊 Total articles included: ${allArticlesCount.total}`);
      
      exec(`open ${fileName}`);
      
      rl.close();
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error("An error occurred:", error.message);
      if (error.message.includes("API key")) {
        console.error("Please make sure you have set your API keys in the .env file.");
      }
    } else {
      console.error("An unknown error occurred:", error);
    }
    rl.close();
  }
}

main();
