import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig, MailConfig } from '../config/configuration';
import {
  downloadReadyTemplate,
  invoiceTemplate,
  type OrderEmailData,
  orderFailedTemplate,
  passwordResetTemplate,
  purchaseSuccessTemplate,
  verificationTemplate,
  welcomeTemplate,
} from './templates/email.templates';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private from!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const mail = this.configService.getOrThrow<MailConfig>('mail');
    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.password } : undefined,
    });
    this.from = `"${mail.fromName}" <${mail.fromAddress}>`;
  }

  private get frontendUrl(): string {
    return this.configService.getOrThrow<AppConfig>('app').frontendUrl;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent: "${subject}" -> ${to}`);
    } catch (error) {
      // Never crash a request flow on mail failure — log and continue.
      this.logger.error(`Failed to send "${subject}" to ${to}: ${(error as Error).message}`);
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(to, 'Verify your email', verificationTemplate(name, url));
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send(to, 'Reset your password', passwordResetTemplate(name, url));
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send(to, 'Welcome to Aperture', welcomeTemplate(name, this.frontendUrl));
  }

  // ---- marketplace ----

  async sendPurchaseSuccessEmail(to: string, name: string, order: OrderEmailData): Promise<void> {
    const url = `${this.frontendUrl}/dashboard/downloads`;
    await this.send(
      to,
      `Order ${order.invoiceNumber} confirmed`,
      purchaseSuccessTemplate(name, order, url),
    );
  }

  async sendInvoiceEmail(to: string, name: string, order: OrderEmailData): Promise<void> {
    const url = `${this.frontendUrl}/dashboard/orders`;
    await this.send(to, `Invoice ${order.invoiceNumber}`, invoiceTemplate(name, order, url));
  }

  async sendDownloadReadyEmail(to: string, name: string, albumTitle: string): Promise<void> {
    const url = `${this.frontendUrl}/dashboard/downloads`;
    await this.send(to, 'Your download is ready', downloadReadyTemplate(name, albumTitle, url));
  }

  async sendOrderFailedEmail(to: string, name: string, invoiceNumber: string): Promise<void> {
    const url = `${this.frontendUrl}/cart`;
    await this.send(
      to,
      'Payment could not be completed',
      orderFailedTemplate(name, invoiceNumber, url),
    );
  }

  /** Daily activity digest — sent by the mail queue worker. */
  async sendDigestEmail(to: string, name: string, unreadCount: number): Promise<void> {
    const url = `${this.frontendUrl}/dashboard/notifications`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2>Hi ${name || 'there'},</h2>
        <p>You have <strong>${unreadCount}</strong> unread notification${unreadCount === 1 ? '' : 's'} waiting on Aperture.</p>
        <p><a href="${url}" style="color:#0a84ff">View your notifications →</a></p>
      </div>`;
    await this.send(
      to,
      `You have ${unreadCount} new notification${unreadCount === 1 ? '' : 's'}`,
      html,
    );
  }
}
