import { Resend } from 'resend';
import { nanoid } from 'nanoid';

// Lazy initialization to avoid crashes when env var is missing
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend not configured - RESEND_API_KEY missing');
      return null;
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export class EmailService {
  private fromEmail = 'incorporate.run <onboarding@resend.dev>'; // Update with your verified domain

  // Check if service is available
  private isAvailable(): boolean {
    return getResend() !== null;
  }

  // Send magic link for document signature
  async sendSignatureRequest(
    recipientEmail: string,
    recipientName: string,
    documentTitle: string,
    magicToken: string,
    baseUrl: string
  ): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Email service unavailable - skipping signature request email to', recipientEmail);
      return;
    }
    
    const signatureUrl = `${baseUrl}/sign/${magicToken}`;
    const client = getResend();
    if (!client) return;
    
    await client.emails.send({
      from: this.fromEmail,
      to: recipientEmail,
      subject: `Sign: ${documentTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Document Signature Request</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
              You've been asked to sign <strong>${documentTitle}</strong>. Click the button below to review and sign the document.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureUrl}" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Review & Sign Document
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              This signature request will expire in 30 days. If you have any questions, please contact the person who sent you this request.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${signatureUrl}" style="color: #2563eb; word-break: break-all;">${signatureUrl}</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #9ca3af;">
              Powered by <strong style="color: #2563eb;">incorporate.run</strong>
            </p>
          </div>
        </div>
      `,
    });
  }

  // Send founder invitation
  async sendFounderInvitation(
    recipientEmail: string,
    recipientName: string,
    companyName: string,
    inviterName: string
  ): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Email service unavailable - skipping founder invitation to', recipientEmail);
      return;
    }
    
    const client = getResend();
    if (!client) return;
    
    await client.emails.send({
      from: this.fromEmail,
      to: recipientEmail,
      subject: `You've been added as a founder of ${companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Founder Invitation</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
              <strong>${inviterName}</strong> has added you as a founder of <strong>${companyName}</strong> on incorporate.run.
            </p>
            
            <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
              You'll receive separate emails with documents to review and sign. Welcome to the team!
            </p>
            
            <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 6px;">
              <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6;">
                <strong>Next steps:</strong><br/>
                • Watch for signature request emails<br/>
                • Upload your ID for verification<br/>
                • Review equity allocations and vesting schedules
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #9ca3af;">
              Powered by <strong style="color: #2563eb;">incorporate.run</strong>
            </p>
          </div>
        </div>
      `,
    });
  }

  // Generate magic token
  generateMagicToken(): string {
    return nanoid(32);
  }
}

export const emailService = new EmailService();
