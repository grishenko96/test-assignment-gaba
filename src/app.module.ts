import { Module } from '@nestjs/common';
import { PromocodesModule } from './promocodes/promocodes.module';
import { PrismaModule } from './prisma/prisma.module';
import { validate } from '../common/config/env.validation';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule } from '../common/logger/app-logger.module';
import { AppThrottlerModule } from '../common/throttler/app-throttler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    AppLoggerModule,
    AppThrottlerModule,
    PrismaModule,
    PromocodesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
