import { createBestAIProvider } from "@juspay/neurolink";
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';
import { NewsArticle, fetchNews } from "../tools/news-fetcher";

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

    rl.question('Enter your topic of interest (e.g., "AI safety"): ', async (topic) => {
      if (!topic.trim()) {
        console.log("No topic entered. Exiting.");
        rl.close();
        return;
      }
      
      console.log("\n🔍 Generating your personalized news briefing...");
      
      const result = await aiProvider.generateText({
        prompt: `Fetch the latest news about ${topic}.`,
        tools: {
          fetchNews: {
            description: "Fetches the latest news articles for a given topic.",
            parameters: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic to fetch news for."
                }
              },
              "required": ["topic"]
            },
            execute: fetchNews,
          }
        }
      });

      let html = `
        <html>
          <head>
            <title>News Briefing for ${topic}</title>
            <style>
              body { font-family: sans-serif; }
              .article { margin-bottom: 2em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
              h2 { margin-bottom: 0.5em; }
              .meta { font-style: italic; color: #555; }
            </style>
          </head>
          <body>
            <h1>News Briefing for ${topic}</h1>
      `;

      if (result && result.text) {
        // The tool's result is expected to be a JSON string in the text property
        const articles: NewsArticle[] = JSON.parse(result.text);

        for (const article of articles) {
          const summary = await aiProvider.streamText({
            prompt: `Summarize the following article in one concise, informative paragraph of about 4-5 sentences.
              Make the summary valuable to a reader scanning for important information.
              It should be like you are quick news reporter.
              
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
              <h2><a href="${article.link}" target="_blank">${article.title}</a></h2>
              <div class="meta">
                <span>Source: ${article.source}</span> | 
                <span>Published: ${new Date(article.pubDate).toLocaleString()}</span>
              </div>
              <p>${summaryText}</p>
            </div>
          `;
        }
      } else {
        html += `<p>Could not fetch news at this time. Please try again later.</p>`;
      }

      html += `
          </body>
        </html>
      `;
      
      const fileName = `news-briefing-${Date.now()}.html`;
      const filePath = path.join(process.cwd(), fileName);
      fs.writeFileSync(fileName, html);
      
      console.log(`\n📰 Your news briefing is ready!`);
      console.log(`📄 File saved to: ${fileName}`);
      
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