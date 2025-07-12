import * as nodemailer from 'nodemailer';
import { createReadStream } from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  attachmentPath?: string;
  attachmentName?: string;
}

class EmailMcpServer {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail({ to, subject, text, attachmentPath, attachmentName }: SendEmailParams): Promise<{ success: boolean; message: string }> {
    try {
      if (!process.env.EMAIL_USER) {
        throw new Error('EMAIL_USER environment variable is not set');
      }
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
      };
      if (attachmentPath && attachmentName) {
        mailOptions.attachments = [{
          filename: attachmentName,
          content: createReadStream(attachmentPath),
        }];
      }
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        message: `Email successfully sent to ${to}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error sending email',
      };
    }
  }

  async listTools() {
    return [{
      name: 'sendEmail',
      description: 'Sends an email with optional PDF attachment',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Email recipient address' },
          subject: { type: 'string', description: 'Email subject' },
          text: { type: 'string', description: 'Email body text' },
          attachmentPath: { type: 'string', description: 'Path to the file to attach' },
          attachmentName: { type: 'string', description: 'Name of the attachment' },
        },
        required: ['to', 'subject', 'text'],
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

  const server = new EmailMcpServer();

  let result;
  if (toolName === 'sendEmail') {
    result = await server.sendEmail(params as SendEmailParams);
  } else if (toolName === 'listTools') {
    result = await server.listTools();
  } else {
    result = { success: false, message: "Unknown tool" };
  }

  console.log(JSON.stringify(result));
  process.exit(0);
}

handleCommand();
