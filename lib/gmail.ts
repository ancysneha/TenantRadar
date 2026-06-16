import nodemailer from "nodemailer";
import { google } from "googleapis";

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return oauth2Client;
}

async function createTransporter() {
  const oauth2Client = getOAuth2Client();
  const { token } = await oauth2Client.getAccessToken();

  if (!token) {
    throw new Error("Failed to obtain Gmail access token");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER ?? process.env.LANDLORD_EMAIL,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: token,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = await createTransporter();
  const from = process.env.GMAIL_USER ?? process.env.LANDLORD_EMAIL;

  await transporter.sendMail({
    from: `TenantRadar <${from}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
