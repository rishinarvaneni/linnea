'use server';

import { db as prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/providers/email';
import { sendSms } from '@/lib/providers/sms';

export async function executeCampaign(campaignId: string) {
  const session = await getSession();
  
  if (!session || session.role !== 'MERCHANT') {
    throw new Error('Unauthorized');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { userId: session.userId }
  });

  if (!merchant) {
    throw new Error('Unauthorized: No merchant profile found.');
  }

  const merchantId = merchant.id;

  // Idempotency and ownership check
  const campaign = await prisma.campaign.findFirst({
    where: { 
      id: campaignId,
      merchantId: merchantId
    }
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'READY') {
    throw new Error('Campaign has already been processed or is currently sending.');
  }

  // Update status to SENDING to lock it
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' }
  });

  try {
    const audienceCriteria = JSON.parse(campaign.audienceCriteria || '{}');
    
    const customers = await prisma.merchantCustomer.findMany({
      where: {
        merchantId: merchantId,
        ...(campaign.channel === 'EMAIL' || campaign.channel === 'MIXED' ? { emailMarketingOptIn: true } : {}),
        ...(campaign.channel === 'SMS' || campaign.channel === 'MIXED' ? { smsMarketingOptIn: true } : {})
      }
    });

    if (customers.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'NOT_SENT', sentAt: new Date() }
      });
      return { success: true, status: 'NOT_SENT', attemptedCount: 0, successCount: 0, failedCount: 0, message: 'No eligible recipients found.' };
    }

    const emailConfigured = !!process.env.RESEND_API_KEY;
    const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

    if (campaign.channel === 'EMAIL' && !emailConfigured) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'NOT_SENT', sentAt: new Date() }
      });
      return { success: false, status: 'NOT_SENT', attemptedCount: 0, successCount: 0, failedCount: 0, message: 'Email provider is not configured.' };
    }

    if (campaign.channel === 'SMS' && !smsConfigured) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'NOT_SENT', sentAt: new Date() }
      });
      return { success: false, status: 'NOT_SENT', attemptedCount: 0, successCount: 0, failedCount: 0, message: 'SMS provider is not configured.' };
    }
    
    if (campaign.channel === 'MIXED' && !emailConfigured && !smsConfigured) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'NOT_SENT', sentAt: new Date() }
      });
      return { success: false, status: 'NOT_SENT', attemptedCount: 0, successCount: 0, failedCount: 0, message: 'Email and SMS providers are not configured.' };
    }

    let attemptedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      if ((campaign.channel === 'EMAIL' || campaign.channel === 'MIXED') && customer.email && customer.emailMarketingOptIn) {
        if (emailConfigured) {
          attemptedCount++;
          const emailResult = await sendEmail(customer.email, campaign.name, campaign.message);
          
          await prisma.campaignDelivery.create({
            data: {
              campaignId: campaignId,
              merchantCustomerId: customer.id,
              channel: 'EMAIL',
              destination: customer.email,
              status: emailResult.status,
              providerMessageId: emailResult.providerMessageId,
              errorMessage: emailResult.errorMessage,
              sentAt: emailResult.status === 'ACCEPTED' ? new Date() : null
            }
          });

          if (emailResult.status === 'ACCEPTED') successCount++;
          else failedCount++;
        }
      }

      if ((campaign.channel === 'SMS' || campaign.channel === 'MIXED') && customer.phone && customer.smsMarketingOptIn) {
        if (smsConfigured) {
          attemptedCount++;
          const smsResult = await sendSms(customer.phone, campaign.message);
          
          await prisma.campaignDelivery.create({
            data: {
              campaignId: campaignId,
              merchantCustomerId: customer.id,
              channel: 'SMS',
              destination: customer.phone,
              status: smsResult.status,
              providerMessageId: smsResult.providerMessageId,
              errorMessage: smsResult.errorMessage,
              sentAt: smsResult.status === 'ACCEPTED' ? new Date() : null
            }
          });

          if (smsResult.status === 'ACCEPTED') successCount++;
          else failedCount++;
        }
      }
    }

    let finalStatus = 'FAILED';
    if (attemptedCount === 0) {
      finalStatus = 'NOT_SENT';
    } else if (successCount > 0 && failedCount === 0) {
      finalStatus = 'SENT';
    } else if (successCount > 0 && failedCount > 0) {
      finalStatus = 'PARTIALLY_SENT';
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: finalStatus,
        sentAt: new Date()
      }
    });

    let message = undefined;
    if (campaign.channel === 'MIXED') {
      if (!emailConfigured) message = 'Email provider not configured, SMS sent only.';
      if (!smsConfigured) message = 'SMS provider not configured, Email sent only.';
    }
    if (attemptedCount === 0) {
      message = 'No valid delivery destinations found for opted-in users.';
    }

    return { success: true, status: finalStatus, attemptedCount, successCount, failedCount, message };
  } catch (error: any) {
    // If it crashes during sending, mark as FAILED
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    });
    throw new Error(error.message || 'Error executing campaign');
  }
}
