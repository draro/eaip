import { WebhookPayload } from '@/types';

export class WebhookService {
  private static instance: WebhookService;
  private webhookUrl: string;

  private constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  public async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('N8N webhook URL not configured');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'eAIP-Editor/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Webhook failed with status: ${response.status}`);
        return false;
      }

      console.log(`Webhook sent successfully: ${payload.event}`);
      return true;
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }

  public async sendDocumentUpdate(
    docId: string,
    title: string,
    updatedBy: string,
    additionalData?: any
  ): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'document.updated',
      docId,
      title,
      updatedBy,
      timestamp: new Date().toISOString(),
      data: additionalData,
    };

    return this.sendWebhook(payload);
  }

  public async sendDocumentCreated(
    docId: string,
    title: string,
    createdBy: string,
    additionalData?: any
  ): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'document.created',
      docId,
      title,
      updatedBy: createdBy,
      timestamp: new Date().toISOString(),
      data: additionalData,
    };

    return this.sendWebhook(payload);
  }

  public async sendDocumentDeleted(
    docId: string,
    title: string,
    additionalData?: any
  ): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'document.deleted',
      docId,
      title,
      timestamp: new Date().toISOString(),
      data: additionalData,
    };

    return this.sendWebhook(payload);
  }

  public async sendVersionPublished(
    versionId: string,
    additionalData?: any
  ): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'version.published',
      versionId,
      timestamp: new Date().toISOString(),
      data: additionalData,
    };

    return this.sendWebhook(payload);
  }

  public async sendExportCompleted(
    exportJobId: string,
    additionalData?: any
  ): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'export.completed',
      exportJobId,
      timestamp: new Date().toISOString(),
      data: additionalData,
    };

    return this.sendWebhook(payload);
  }
}

export const webhookService = WebhookService.getInstance();