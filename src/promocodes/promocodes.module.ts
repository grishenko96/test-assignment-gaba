import { Module } from '@nestjs/common';
import { PromocodesController } from './controller/promocodes.controller';
import { PromocodesService } from './service/promocodes.service';
import { PromocodesRepository } from './repository/promocodes.repository';
import { PromocodesMapper } from './mapper/promocodes.mapper';

@Module({
  controllers: [PromocodesController],
  providers: [PromocodesService, PromocodesRepository, PromocodesMapper],
})
export class PromocodesModule {}
