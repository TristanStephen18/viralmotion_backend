import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import { JWT_SECRET } from "../database/config.ts";
import { type Request, type Response, Router } from "express";
import { success } from "zod";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const router = Router();

export async function sendEmailVerification(
  userId: number,
  email: string,
  baseUrl: string
) {
  console.log("📧 [SendGrid] Preparing to send verification email");
  console.log("📧 [SendGrid] To:", email);
  console.log("📧 [SendGrid] From:", "viralmotion.app@gmail.com");
  console.log("📧 [SendGrid] API Key exists:", !!process.env.SENDGRID_API_KEY);
  console.log(
    "📧 [SendGrid] API Key starts with:",
    process.env.SENDGRID_API_KEY?.substring(0, 10)
  );

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
    console.log(
      "✅ [SendGrid] Response headers:",
      JSON.stringify(response[0]?.headers, null, 2)
    );
  } catch (error: any) {
    console.error("❌ [SendGrid] Email send error:");
    console.error("❌ [SendGrid] Status code:", error.code);
    console.error("❌ [SendGrid] Message:", error.message);
    console.error(
      "❌ [SendGrid] Response body:",
      JSON.stringify(error.response?.body, null, 2)
    );
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

export async function sendWelcomeEmail(email: string, name?: string) {
  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com",
    },
    subject: "Welcome to Viral Motion! 🎉",
    text: `Welcome to Viral Motion${
      name ? `, ${name}` : ""
    }! We're excited to have you on board.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 50px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Viral Motion!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey starts here</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            ${
              name
                ? `<p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Hi <strong style="color: #7c3aed;">${name}</strong>,</p>`
                : '<p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Hi there,</p>'
            }
            
            <p style="color: #4a4a4a; line-height: 1.8; margin-bottom: 20px; font-size: 15px;">
              We're <strong style="color: #1a1a1a;">thrilled</strong> to have you join our community! 🎉 Your account has been successfully verified and you're all set to get started.
            </p>
            
            <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 4px solid #7c3aed; padding: 25px; margin: 30px 0; border-radius: 8px;">
              <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px; font-weight: 600;">What's Next?</h3>
              <ul style="color: #4a4a4a; line-height: 2; padding-left: 20px; margin-bottom: 0; font-size: 15px;">
                <li>🚀 Explore the dashboard and discover all features</li>
                <li>✨ Create your first project and bring your ideas to life</li>
              </ul>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.8; margin-bottom: 30px; font-size: 15px;">
              If you have any questions or need assistance, our support team is always here to help. Just reply to this email!
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; 
                        padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: 600; 
                        font-size: 16px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); transition: all 0.3s ease;">
                Get Started Now
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
              Best regards,<br>
              <strong style="color: #7c3aed;">The Viral Motion Team</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
              © ${new Date().getFullYear()} Viral Motion. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Welcome email sent successfully!");
  } catch (error: any) {
    console.error(
      "❌ Welcome email send error:",
      error.response?.body || error.message
    );
  }
}




//create new function/route for leave us a message mailing

router.post('/sendemail', async (req: Request, res: Response)=>{
  const {name, email, message} = req.body;
  const msg = {
    to: "viralmotion.app@gmail.com",
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com",
    },
    replyTo: email, // This allows you to reply directly to the user
    subject: `${name} sent us a message`,
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Message</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      New Contact Form Message
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 25px 0; font-size: 16px; color: #111827; line-height: 1.5;">
                      You have received a new message from your ViralMotion landing page contact form.
                    </p>
                    
                    <!-- Sender Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Name:
                              </td>
                              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">
                                ${name}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Email:
                              </td>
                              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">
                                <a href="mailto:${email}" style="color: #8b5cf6; text-decoration: none;">
                                  ${email}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Message -->
                    <div style="margin-bottom: 25px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Message:
                      </p>
                      <div style="padding: 20px; background-color: #f9fafb; border-left: 4px solid #8b5cf6; border-radius: 6px;">
                        <p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap;">
                          ${message}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Reply Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:${email}" style="display: inline-block; padding: 14px 28px; background-color: #8b5cf6; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);">
                            Reply to ${name}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                      This message was sent from the contact form on your ViralMotion landing page.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  };

  try {
    await sgMail.send(msg);
    console.log("Message sent successfully");
    res.json({
      success: true,
      message: "Email sent successfully"
    })
  } catch (error: any) {
    console.error(
      "User email not sent:",
      error.response?.body || error.message
    );
    res.status(400).json({
      success: false,
      message: "Error sending email"
    })
  }
})


// export async function sendUserMessageToSelfEmail(
//   email: string,
//   message: string,
//   name: string,
// ) {
//   const msg = {
//     to: "viralmotion.app@gmail.com",
//     from: {
//       name: "Viral Motion",
//       email: "viralmotion.app@gmail.com",
//     },
//     replyTo: email, // This allows you to reply directly to the user
//     subject: `${name} sent us a message`,
//     html: `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>New Contact Form Message</title>
//       </head>
//       <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
//         <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
//           <tr>
//             <td align="center">
//               <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
//                 <!-- Header -->
//                 <tr>
//                   <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center;">
//                     <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
//                       New Contact Form Message
//                     </h1>
//                   </td>
//                 </tr>
                
//                 <!-- Content -->
//                 <tr>
//                   <td style="padding: 40px 30px;">
//                     <p style="margin: 0 0 25px 0; font-size: 16px; color: #111827; line-height: 1.5;">
//                       You have received a new message from your ViralMotion landing page contact form.
//                     </p>
                    
//                     <!-- Sender Info -->
//                     <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
//                       <tr>
//                         <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
//                           <table width="100%" cellpadding="0" cellspacing="0">
//                             <tr>
//                               <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
//                                 Name:
//                               </td>
//                               <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">
//                                 ${name}
//                               </td>
//                             </tr>
//                             <tr>
//                               <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
//                                 Email:
//                               </td>
//                               <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">
//                                 <a href="mailto:${email}" style="color: #8b5cf6; text-decoration: none;">
//                                   ${email}
//                                 </a>
//                               </td>
//                             </tr>
//                           </table>
//                         </td>
//                       </tr>
//                     </table>
                    
//                     <!-- Message -->
//                     <div style="margin-bottom: 25px;">
//                       <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
//                         Message:
//                       </p>
//                       <div style="padding: 20px; background-color: #f9fafb; border-left: 4px solid #8b5cf6; border-radius: 6px;">
//                         <p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap;">
//                           ${message}
//                         </p>
//                       </div>
//                     </div>
                    
//                     <!-- Reply Button -->
//                     <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
//                       <tr>
//                         <td align="center">
//                           <a href="mailto:${email}" style="display: inline-block; padding: 14px 28px; background-color: #8b5cf6; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);">
//                             Reply to ${name}
//                           </a>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
                
//                 <!-- Footer -->
//                 <tr>
//                   <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
//                     <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
//                       This message was sent from the contact form on your ViralMotion landing page.
//                     </p>
//                   </td>
//                 </tr>
                
//               </table>
//             </td>
//           </tr>
//         </table>
//       </body>
//     </html>
//   `,
//   };

//   try {
//     await sgMail.send(msg);
//     console.log("Message sent successfully");
//   } catch (error: any) {
//     console.error(
//       "User email not sent:",
//       error.response?.body || error.message
//     );
//   }
// }

export default router;