import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailQueue } from './mail.queue';
import { MailProcessor } from './processors/mail.processor';
import { MailModule } from '../../modules/mail/mail.module';
import { OpenaiModule } from 'src/modules/openai/openai.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'mail',
    }),
    MailModule,
    OpenaiModule,
  ],
  providers: [MailQueue, MailProcessor],
  exports: [MailQueue],
})
export class QueuesModule {}
