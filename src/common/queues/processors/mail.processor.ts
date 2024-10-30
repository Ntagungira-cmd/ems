import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '../../../modules/mail/mail.service';
import { Logger } from '@nestjs/common';
import { OpenAIService } from 'src/modules/openai/openai.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly openAIService: OpenAIService,
  ) {}

  @Process('attendance-checkin')
  async handleAttendanceCheckIn(job: Job) {
    const { employee, attendance } = job.data;

    try {
      const prompt = `Generate a friendly email message for ${employee.name} acknowledging their check-in at ${attendance.checkIn}. Include a positive greeting and a brief motivational message for the day.`;

      const aiGeneratedMessage = await this.openAIService.generateText(prompt);

      await this.mailService.sendMail({
        to: employee.email,
        subject: 'Attendance Check-In Confirmation',
        template: 'attendance',
        context: {
          name: employee.name,
          type: 'check-in',
          time: attendance.checkIn,
          message: aiGeneratedMessage,
        },
      });

      this.logger.log(`Check-in email sent to ${employee.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send check-in email to ${employee.email}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('attendance-checkout')
  async handleAttendanceCheckOut(job: Job) {
    const { employee, attendance } = job.data;

    try {
      const prompt = `Generate a friendly email message for ${employee.name} acknowledging their check-out at ${attendance.checkOut}. Include a thank you message and wish them a good rest of their day.`;

      const aiGeneratedMessage = await this.openAIService.generateText(prompt);

      await this.mailService.sendMail({
        to: employee.email,
        subject: 'Attendance Check-Out Confirmation',
        template: 'attendance',
        context: {
          name: employee.name,
          type: 'check-out',
          time: attendance.checkOut,
          message: aiGeneratedMessage,
        },
      });

      this.logger.log(`Check-out email sent to ${employee.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send check-out email to ${employee.email}`,
        error.stack,
      );
      throw error;
    }
  }
}
