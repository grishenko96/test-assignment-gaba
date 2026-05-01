import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';

        return {
          pinoHttp: {
            level: configService.get<string>(
              'LOG_LEVEL',
              isProduction ? 'info' : 'debug',
            ),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
              ],
              remove: true,
            },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                },
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
