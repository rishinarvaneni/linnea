import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SmsDeliveryResult {
  status: 'ACCEPTED' | 'FAILED' | 'NOT_CONFIGURED';
  providerMessageId?: string;
  errorMessage?: string;
}

export async function sendSms(to: string, body: string): Promise<SmsDeliveryResult> {
  if (!client || !fromPhone) {
    return { status: 'NOT_CONFIGURED', errorMessage: 'SMS provider is not configured.' };
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: fromPhone,
      to: to
    });

    return { status: 'ACCEPTED', providerMessageId: message.sid };
  } catch (error: any) {
    return { status: 'FAILED', errorMessage: error.message || 'Unknown provider error' };
  }
}
