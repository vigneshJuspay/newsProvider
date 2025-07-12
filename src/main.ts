import { createBestAIProvider, NeuroLink } from "@juspay/neurolink";
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { fetchNews } from "../tools/news-fetcher";
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

function saveMCPConfig(config: any): { success: boolean; error?: string } {
  try {
    fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error: any) {
    console.error("[MCP] Error saving config:", error.message);
    return { success: false, error: error.message };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function executeMCPCommand(serverName: string, toolName: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const command = `npx ts-node mcp/email/email-mcp-server.ts ${toolName} --params '${JSON.stringify(params)}'`;
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${stderr || error.message}`);
        return reject(new Error(stderr || error.message));
      }
      
      if (stderr) {
        console.warn(`stderr: ${stderr}`);
      }
      
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        resolve({ success: true, message: stdout });
      }
    });
  });
}

async function main() {
  console.log("🌟 NeuroLink Personalized Content Curator 🌟");
  console.log("------------------------------------------");

  try {
    const aiProvider = await createBestAIProvider();
    
    // Initialize NeuroLink with MCP support
    const neurolink = new NeuroLink();
    
    // The email server is now a standalone script, so no registration is needed.

    // Collect user input for topics
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
      
      // Ask for the recipient email address
      rl.question('Enter the email address to send the news briefing to: ', async (emailAddress) => {
        if (!emailAddress.trim() || !emailAddress.includes('@')) {
          console.log("Invalid email address. Exiting.");
          rl.close();
          return;
        }
        
        console.log(`\n🔍 Generating your personalized news briefing for ${topics.length} topics...`);
        
        // Prepare data for PDF generation
        const articlesByTopic: Record<string, { article: any; summary: string }[]> = {};
        const allArticlesCount = { total: 0 };
        
        // Fetch and process news for each topic
        for (const topic of topics) {
          console.log(`\n📰 Fetching news for topic: ${topic}...`);
          const articles = await fetchNews(topic);
          
          if (!articles || articles.length === 0) {
            console.log(`⚠️ No articles found for topic: ${topic}. Moving to next topic.`);
            continue;
          }
          
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
        }
        
        if (allArticlesCount.total === 0) {
          console.log("\n⚠️ No articles found for any of the topics. Try different topics or check your connection.");
          rl.close();
          return;
        }
        
        // Generate PDF
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
        
        // Send email with the PDF attachment using MCP
        console.log(`\n📧 Sending email to ${emailAddress}...`);
        try {
          // Use MCP to send the email
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
