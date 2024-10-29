import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class MailQueue {
  constructor(
    @InjectQueue('mail')
    private mailQueue: Queue,
  ) {}

  async add(
    type: 'attendance-checkin' | 'attendance-checkout' | 'reset-password',
    data: any,
    opts?: any,
  ) {
    return this.mailQueue.add(type, data, opts);
  }
}
