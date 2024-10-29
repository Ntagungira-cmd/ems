import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('mail.host'),
      port: this.configService.get('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.password'),
      },
    });
  }

  private async compileTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'templates',
      `${templateName}.hbs`,
    );
    const template = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(template)(context);
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('APP_URL')}/auth/reset-password?token=${resetToken}`;
    const html = await this.compileTemplate('reset-password', {
      resetUrl,
      name,
    });

    await this.transporter.sendMail({
      from: this.configService.get('mail.from'),
      to,
      subject: 'Password Reset Request',
      html,
    });
  }

  async sendWelcomeEmail(to: string, name: string, autoPassword:string ): Promise<void> {
    const html = await this.compileTemplate('welcome', { name, autoPassword });

    await this.transporter.sendMail({
      from: this.configService.get('mail.from'),
      to,
      subject: 'Welcome to our platform',
      html,
    });
  }

  async sendMail(data: { to: string; subject: string; template: string; context: any }): Promise<void> {
    const html = await this.compileTemplate(data.template, data.context);

    await this.transporter.sendMail({
      from: this.configService.get('mail.from'),
      to: data.to,
      subject: data.subject,
      html,
    });
  }


}
