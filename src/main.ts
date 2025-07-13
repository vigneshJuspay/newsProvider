import { createBestAIProvider, NeuroLink } from "@juspay/neurolink";
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { generateNewsPDF } from './pdf-generator';

dotenv.config();

const MCP_CONFIG_FILE = path.join(process.cwd(), ".mcp-config.json");

function loadMCPConfig(): any {
  try {
    if (!fs.existsSync(MCP_CONFIG_FILE)) {
      return { mcpServers: {} };
    }
    const content = fs.readFileSync(MCP_CONFIG_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    console.error("[MCP] Error loading config:", error.message);
    return { mcpServers: {} };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function executeMCPCommand(serverName: string, toolName: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpConfig = loadMCPConfig();
    const serverConfig = mcpConfig.mcpServers[serverName];
    
    if (!serverConfig) {
      return reject(new Error(`MCP server "${serverName}" not found in config`));
    }
    
    const command = `${serverConfig.command} ${serverConfig.args.join(' ')} ${toolName} --params '${JSON.stringify(params)}'`;
    
    console.log(`[DEBUG] Executing MCP command: ${command}`);
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${stderr || error.message}`);
        return reject(new Error(stderr || error.message));
      }
      
      if (stderr) {
        console.warn(`stderr: ${stderr}`);
      }
      
      console.log(`[DEBUG] MCP response raw: ${stdout.substring(0, 200)}...`);
      
      try {
        const jsonStartMarker = "---JSON_START---";
        const jsonEndMarker = "---JSON_END---";
        const startIndex = stdout.indexOf(jsonStartMarker);
        const endIndex = stdout.indexOf(jsonEndMarker);
        
        if (startIndex >= 0 && endIndex > startIndex) {
          const jsonString = stdout.substring(startIndex + jsonStartMarker.length, endIndex).trim();
          console.log(`[DEBUG] Extracted JSON string: ${jsonString.substring(0, 200)}...`);
          
          const result = JSON.parse(jsonString);
          console.log(`[DEBUG] MCP parsed response: ${JSON.stringify(result).substring(0, 200)}...`);
          resolve(result);
        } else {
          const jsonStartIndex = stdout.indexOf('{');
          const jsonEndIndex = stdout.lastIndexOf('}');
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            const jsonString = stdout.substring(jsonStartIndex, jsonEndIndex + 1);
            console.log(`[DEBUG] Fallback extraction - JSON string: ${jsonString.substring(0, 200)}...`);
            
            const result = JSON.parse(jsonString);
            console.log(`[DEBUG] Fallback parsed response: ${JSON.stringify(result).substring(0, 200)}...`);
            resolve(result);
          } else {
            console.log(`[DEBUG] Could not find valid JSON in response`);
            resolve({ success: false, message: "Invalid response format from MCP server" });
          }
        }
      } catch (e) {
        console.log(`[DEBUG] Failed to parse MCP response as JSON:`, e);
        resolve({ success: false, message: "Failed to parse response from MCP server" });
      }
    });
  });
}

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
      
      rl.question('Enter the email address to send the news briefing to: ', async (emailAddress) => {
        if (!emailAddress.trim() || !emailAddress.includes('@')) {
          console.log("Invalid email address. Exiting.");
          rl.close();
          return;
        }
        
        console.log(`\n🔍 Generating your personalized news briefing for ${topics.length} topics...`);
        
        const articlesByTopic: Record<string, { article: any; summary: string }[]> = {};
        const allArticlesCount = { total: 0 };
        
        for (const topic of topics) {
          console.log(`\n📰 Fetching news for topic: ${topic}...`);
          
          try {
            console.log(`[DEBUG] Calling news MCP server for topic: ${topic}`);
            const newsResult = await executeMCPCommand("news", "fetchNews", { topic });
            console.log(`[DEBUG] News result success: ${newsResult.success}, has articles: ${newsResult.articles ? 'yes' : 'no'}, articles count: ${newsResult.articles?.length || 0}`);
            
            if (!newsResult.success || !newsResult.articles || newsResult.articles.length === 0) {
              console.log(`⚠️ No articles found for topic: ${topic}. Moving to next topic.`);
              continue;
            }
            
            const articles = newsResult.articles;
            allArticlesCount.total += articles.length;
            articlesByTopic[topic] = [];
            
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
              
              articlesByTopic[topic].push({ article, summary: summaryText });
            }
          } catch (error) {
            console.error(`⚠️ Error fetching news for topic '${topic}':`, error instanceof Error ? error.message : error);
          }
        }
        
        if (allArticlesCount.total === 0) {
          console.log("\n⚠️ No articles found for any of the topics. Try different topics or check your connection.");
          rl.close();
          return;
        }
        
        console.log(`\n📄 Generating PDF document...`);
        const title = "Multi-Topic News Briefing";
        const date = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        const pdfPath = await generateNewsPDF({
          title,
          date,
          topics,
          articlesByTopic
        });
        
        console.log(`📄 PDF saved to: ${pdfPath}`);
        
        console.log(`\n📧 Sending email to ${emailAddress}...`);
        try {
          const emailResult = await executeMCPCommand("email", "sendEmail", {
            to: emailAddress,
            subject: `Your Personalized News Briefing - ${date}`,
            text: `Hello,\n\nAttached is your personalized news briefing covering the following topics: ${topics.join(', ')}.\n\nEnjoy your reading!\n\nRegards,\nNeuroLink News Provider`,
            attachmentPath: pdfPath,
            attachmentName: path.basename(pdfPath)
          });
          
          if (emailResult && emailResult.success) {
            console.log(`✅ ${emailResult.message || "Email sent successfully!"}`);
            console.log(`\n✅ Your multi-topic news briefing has been emailed to: ${emailAddress}`);
          } else {
            console.error("⚠️ Email sending reported failure:", emailResult?.message || "Unknown error");
            console.log("You can still view the PDF at:", pdfPath);
          }
        } catch (emailError) {
          console.error("Failed to send email:", emailError instanceof Error ? emailError.message : emailError);
          console.log("You can still view the PDF at:", pdfPath);
        }
        
        console.log(`📊 Total articles included: ${allArticlesCount.total}`);
        rl.close();
      });
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
