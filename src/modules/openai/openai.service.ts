import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
    });
    this.model = this.configService.get<string>('openai.model', 'gpt-4');
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional HR assistant responsible for generating friendly and motivational email content for employees. Keep messages concise, positive, and engaging.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0].message.content || 'Have a great day!';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.getFallbackMessage();
    }
  }

  private getFallbackMessage(): string {
    const fallbackMessages = [
      'Thank you for logging your attendance. Have a productive day!',
      'Your attendance has been recorded. Wishing you a great day ahead!',
      'Thank you for your dedication. Have an excellent day!',
      'Your presence makes a difference. Have a wonderful day!',
    ];

    return fallbackMessages[
      Math.floor(Math.random() * fallbackMessages.length)
    ];
  }

  async generateCheckInMessage(
    employeeName: string,
    checkInTime: Date,
  ): Promise<string> {
    const prompt = `Generate a friendly, professional email message (2-3 sentences) for ${employeeName} who just checked in at ${checkInTime.toLocaleTimeString()}. Include a brief motivational message for their day.`;
    return this.generateText(prompt);
  }

  async generateCheckOutMessage(
    employeeName: string,
    checkOutTime: Date,
  ): Promise<string> {
    const prompt = `Generate a friendly, professional email message (2-3 sentences) for ${employeeName} who just checked out at ${checkOutTime.toLocaleTimeString()}. Thank them for their work today and wish them a good evening.`;
    return this.generateText(prompt);
  }
}
