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


  async sendPasswordResetEmail(email: string, resetToken: string, organizationName: string): Promise<boolean> {
    try {
      // For password reset, we'll send the reset token as the password parameter
      // The n8n workflow can handle this differently based on the context
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

      const payload: N8nEmailPayload = {
        emailTo: email,
        name: 'User', // We don't have the user name in this context
        username: email,
        password: resetUrl // Send the reset URL as the password field for password reset emails
      };

      const success = await this.sendWebhookRequest(payload);

      if (success) {
        console.log('Password reset email sent successfully to:', SecurityUtils.sanitizeLogInput(email));
      }

      return success;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();