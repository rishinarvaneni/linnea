import { Resend } from 'resend';

export interface EmailDeliveryResult {
  status: 'ACCEPTED' | 'FAILED' | 'NOT_CONFIGURED';
  providerMessageId?: string;
  errorMessage?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailDeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { status: 'NOT_CONFIGURED', errorMessage: 'Email provider is not configured (RESEND_API_KEY missing).' };
  }
  const resend = new Resend(resendApiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Linnéa <onboarding@resend.dev>', // Update this when you have a verified domain
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      return { status: 'FAILED', errorMessage: error.message };
    }

    return { status: 'ACCEPTED', providerMessageId: data?.id };
  } catch (error: any) {
    return { status: 'FAILED', errorMessage: error.message || 'Unknown provider error' };
  }
}
