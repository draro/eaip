import { SecurityUtils } from './security';

export interface N8nWebhookConfig {
  testUrl: string;
  productionUrl: string;
  isTestMode: boolean;
}

export interface WelcomeEmailData {
  organizationName: string;
  organizationDomain: string;
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
  loginUrl: string;
  supportEmail?: string;
}

export interface N8nEmailPayload {
  emailTo: string;
  name: string;
  username: string;
  password: string;
}

export class EmailService {
  private webhookConfig: N8nWebhookConfig;

  constructor() {
    this.webhookConfig = this.getWebhookConfig();
  }

  private getWebhookConfig(): N8nWebhookConfig {
    // Default to test mode in development
    const isTestMode = process.env.NODE_ENV !== 'production' || process.env.N8N_EMAIL_TEST_MODE === 'true';

    return {
      testUrl: process.env.N8N_EMAIL_TEST_WEBHOOK || 'http://localhost:5678/webhook-test/email-password',
      productionUrl: process.env.N8N_EMAIL_WEBHOOK || 'http://localhost:5678/webhook/email-password',
      isTestMode
    };
  }

  private getWebhookUrl(): string {
    return this.webhookConfig.isTestMode
      ? this.webhookConfig.testUrl
      : this.webhookConfig.productionUrl;
  }

  private async sendWebhookRequest(payload: N8nEmailPayload): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Email webhook sent successfully:', {
          url: webhookUrl,
          to: SecurityUtils.sanitizeLogInput(payload.emailTo),
          isTestMode: this.webhookConfig.isTestMode
        });
        return true;
      } else {
        console.error('Email webhook failed:', {
          status: response.status,
          statusText: response.statusText,
          url: webhookUrl
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending email webhook:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const payload: N8nEmailPayload = {
        emailTo: data.adminEmail,
        name: data.adminName,
        username: data.adminEmail, // Using email as username
        password: data.temporaryPassword
      };

      const success = await this.sendWebhookRequest(payload);

      if (success) {
        console.log('Welcome email sent successfully:', {
          to: SecurityUtils.sanitizeLogInput(data.adminEmail),
          organization: SecurityUtils.sanitizeLogInput(data.organizationName),
          isTestMode: this.webhookConfig.isTestMode
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }


  async sendPasswordResetEmail(data: {
    userName: string;
    userEmail: string;
    temporaryPassword: string;
    loginUrl: string;
    organizationName: string;
    supportEmail?: string;
  }): Promise<boolean> {
    try {
      const payload: N8nEmailPayload = {
        emailTo: data.userEmail,
        name: data.userName,
        username: data.userEmail,
        password: data.temporaryPassword
      };

      const success = await this.sendWebhookRequest(payload);

      if (success) {
        console.log('Password reset email sent successfully to:', SecurityUtils.sanitizeLogInput(data.userEmail));
      }

      return success;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendReviewRequestEmail(data: {
    reviewerEmail: string;
    reviewerName: string;
    requesterName: string;
    documentTitle: string;
    documentLink: string;
    organizationName: string;
  }): Promise<boolean> {
    try {
      // For now, use generic email webhook
      // In production, you'd have a specific template for reviews
      const webhookUrl = this.getWebhookUrl();

      const payload = {
        emailTo: data.reviewerEmail,
        subject: `Review Requested: ${data.documentTitle}`,
        name: data.reviewerName,
        message: `${data.requesterName} has requested your review for "${data.documentTitle}". Please review at your earliest convenience.`,
        link: data.documentLink,
        organization: data.organizationName
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const success = response.ok;
      if (success) {
        console.log('Review request email sent to:', SecurityUtils.sanitizeLogInput(data.reviewerEmail));
      }
      return success;
    } catch (error) {
      console.error('Failed to send review request email:', error);
      return false;
    }
  }

  async sendApprovalRequestEmail(data: {
    approverEmail: string;
    approverName: string;
    requesterName: string;
    documentTitle: string;
    documentLink: string;
    organizationName: string;
  }): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookUrl();

      const payload = {
        emailTo: data.approverEmail,
        subject: `Approval Requested: ${data.documentTitle}`,
        name: data.approverName,
        message: `${data.requesterName} has requested your approval for "${data.documentTitle}". Please review and approve at your earliest convenience.`,
        link: data.documentLink,
        organization: data.organizationName
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const success = response.ok;
      if (success) {
        console.log('Approval request email sent to:', SecurityUtils.sanitizeLogInput(data.approverEmail));
      }
      return success;
    } catch (error) {
      console.error('Failed to send approval request email:', error);
      return false;
    }
  }

  async sendReviewCompletedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    reviewerName: string;
    documentTitle: string;
    documentLink: string;
    status: 'approved' | 'rejected';
    comments?: string;
  }): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookUrl();

      const statusText = status === 'approved' ? 'approved' : 'rejected';
      const payload = {
        emailTo: data.recipientEmail,
        subject: `Review ${statusText}: ${data.documentTitle}`,
        name: data.recipientName,
        message: `${data.reviewerName} has ${statusText} your document "${data.documentTitle}"${data.comments ? `. Comments: ${data.comments}` : ''}`,
        link: data.documentLink,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send review completed email:', error);
      return false;
    }
  }

  async sendApprovalCompletedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    approverName: string;
    documentTitle: string;
    documentLink: string;
    status: 'approved' | 'rejected';
    comments?: string;
  }): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookUrl();

      const statusText = status === 'approved' ? 'approved' : 'rejected';
      const payload = {
        emailTo: data.recipientEmail,
        subject: `Approval ${statusText}: ${data.documentTitle}`,
        name: data.recipientName,
        message: `${data.approverName} has ${statusText} your document "${data.documentTitle}"${data.comments ? `. Comments: ${data.comments}` : ''}`,
        link: data.documentLink,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send approval completed email:', error);
      return false;
    }
  }

  async sendChecklistCompletedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    completedBy: string;
    documentTitle: string;
    documentLink: string;
    organizationName: string;
  }): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookUrl();

      const payload = {
        emailTo: data.recipientEmail,
        subject: `Checklist Completed: ${data.documentTitle}`,
        name: data.recipientName,
        message: `${data.completedBy} has completed the checklist "${data.documentTitle}". All required items have been checked off.`,
        link: data.documentLink,
        organization: data.organizationName
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send checklist completed email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();