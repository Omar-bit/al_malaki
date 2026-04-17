import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';

export interface SendEmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface OtpEmailTemplateOptions {
  brandName?: string;
  heading?: string;
  introText?: string;
  expiryNoticeTemplate?: string;
  ignoreRequestText?: string;
  ignoreRequestTextAr?: string;
  backgroundColor?: string;
  cardBorderColor?: string;
  accentStartColor?: string;
  accentEndColor?: string;
}

export interface SendOtpEmailPayload {
  to: string;
  otpCode: string;
  expiresInMinutes: number;
  subject?: string;
  from?: string;
  template?: OtpEmailTemplateOptions;
}

interface OtpEmailContent {
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    const fromAddress = payload.from ?? this.getDefaultFromAddress();
    const transporter = await this.getTransporter();

    const sendOptions: SendMailOptions = {
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo,
    };

    try {
      await transporter.sendMail(sendOptions);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${payload.to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Unable to send email at the moment. Please try again later',
      );
    }
  }

  async sendOtpEmail(payload: SendOtpEmailPayload): Promise<void> {
    const content = this.buildOtpEmailContent(payload);

    await this.sendEmail({
      to: payload.to,
      from: payload.from,
      subject:
        payload.subject ??
        this.configService.get<string>('REGISTER_OTP_EMAIL_SUBJECT') ??
        'Your verification code',
      text: content.text,
      html: content.html,
    });
  }

  private buildOtpEmailContent(payload: SendOtpEmailPayload): OtpEmailContent {
    const template = payload.template ?? {};
    const brandName = template.brandName ?? 'AL MALAKI';
    const heading = template.heading ?? 'Verify your email address';
    const introText =
      template.introText ??
      'Use the following one-time passcode to complete your registration.';
    const expiryNoticeTemplate =
      template.expiryNoticeTemplate ??
      'This code expires in {{minutes}} minute(s).';
    const expiryNotice = expiryNoticeTemplate.replace(
      '{{minutes}}',
      payload.expiresInMinutes.toString(),
    );
    const ignoreRequestText =
      template.ignoreRequestText ??
      'If you did not request this code, please ignore this email.';
    const ignoreRequestTextAr =
      template.ignoreRequestTextAr ??
      'إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.';

    const backgroundColor = template.backgroundColor ?? '#f6efe3';
    const cardBorderColor = template.cardBorderColor ?? '#ead8bf';
    const accentStartColor = template.accentStartColor ?? '#f8ecd8';
    const accentEndColor = template.accentEndColor ?? '#e8d4b5';

    const otpDigits = payload.otpCode
      .split('')
      .map(
        (digit) =>
          `<span style="display:inline-block;width:42px;height:50px;line-height:50px;margin:0 4px;border-radius:12px;background:#f6ecdf;border:1px solid #d5b88e;color:#3f060f;font-size:24px;font-weight:700;text-align:center;">${digit}</span>`,
      )
      .join('');

    return {
      text: `${brandName} verification code: ${payload.otpCode}. ${expiryNotice}`,
      html: `
        <div style="margin:0;padding:24px;background:${backgroundColor};font-family:Georgia,'Times New Roman',serif;color:#3f060f;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${cardBorderColor};">
            <tr>
              <td style="padding:28px 28px 16px;background:linear-gradient(120deg,${accentStartColor},${accentEndColor});text-align:center;">
                <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7d5645;">${brandName}</p>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;color:#3f060f;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#5a3b33;">${introText}</p>
                <div style="text-align:center;padding:14px 0 6px;">${otpDigits}</div>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#7a5b4f;text-align:center;">${expiryNotice}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 28px 26px;">
                <div style="margin-top:14px;padding:14px;border-radius:12px;background:#faf5ec;border:1px solid #efe0c9;">
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#7a5b4f;">${ignoreRequestText}</p>
                  <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:#7a5b4f;direction:rtl;text-align:right;">${ignoreRequestTextAr}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `,
    };
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const rawPort = this.configService.get<string>('SMTP_PORT')?.trim();
    const username = this.configService.get<string>('SMTP_USER')?.trim();
    const password = this.configService.get<string>('SMTP_PASS')?.trim();

    if (!host) {
      throw new InternalServerErrorException(
        'SMTP host is not configured. Set SMTP_HOST before sending emails',
      );
    }

    const parsedPort = Number(rawPort);
    const port = Number.isNaN(parsedPort) || parsedPort <= 0 ? 587 : parsedPort;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(username && password
        ? {
            auth: {
              user: username,
              pass: password,
            },
          }
        : {}),
    });

    return this.transporter;
  }

  private getDefaultFromAddress(): string {
    const fromAddress =
      this.configService.get<string>('REGISTER_OTP_EMAIL_FROM')?.trim() ??
      this.configService.get<string>('SMTP_FROM')?.trim();

    if (!fromAddress) {
      throw new InternalServerErrorException(
        'Sender email is not configured. Set REGISTER_OTP_EMAIL_FROM or SMTP_FROM',
      );
    }

    return fromAddress;
  }
}
