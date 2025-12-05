import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import { JWT_SECRET } from "../database/config.ts";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function sendEmailVerification(userId: number, email: string, baseUrl: string) {
  console.log("📧 [SendGrid] Preparing to send verification email");
  console.log("📧 [SendGrid] To:", email);
  console.log("📧 [SendGrid] From:", "viralmotion.app@gmail.com");
  console.log("📧 [SendGrid] API Key exists:", !!process.env.SENDGRID_API_KEY);
  console.log("📧 [SendGrid] API Key starts with:", process.env.SENDGRID_API_KEY?.substring(0, 10));

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  const url = `${baseUrl}/auth/verify?token=${token}`;

  console.log("📧 [SendGrid] Verification URL:", url);

  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com",
    },
    subject: "Verify Your Email",
    text: `Click this link to verify your account: ${url}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email Verification</h2>
        <p>Please click the button below to verify your account:</p>
        <p>
          <a href="${url}" 
             style="display: inline-block; background-color: #4CAF50; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p><a href="${url}">${url}</a></p>
      </div>
    `,
  };

  console.log("📧 [SendGrid] Sending email...");

  try {
    const response = await sgMail.send(msg);
    console.log("✅ [SendGrid] Email sent successfully!");
    console.log("✅ [SendGrid] Response status:", response[0]?.statusCode);
    console.log("✅ [SendGrid] Response headers:", JSON.stringify(response[0]?.headers, null, 2));
  } catch (error: any) {
    console.error("❌ [SendGrid] Email send error:");
    console.error("❌ [SendGrid] Status code:", error.code);
    console.error("❌ [SendGrid] Message:", error.message);
    console.error("❌ [SendGrid] Response body:", JSON.stringify(error.response?.body, null, 2));
    throw error; // Re-throw so signup route knows it failed
  }
}

export async function sendOtpEmail(email: string): Promise<string | null> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpToken = jwt.sign({ email, otp }, JWT_SECRET, { expiresIn: "10m" });

  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com", // same sender
    },
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; text-align: center;">
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to reset your password. It will expire in <strong>10 minutes</strong>.</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #4CAF50;">
          ${otp}
        </div>
        <p>If you didn’t request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ OTP email sent successfully!");
    return otpToken;
  } catch (error: any) {
    console.error("❌ OTP send error:", error.response?.body || error.message);
    return null;
  }
}
