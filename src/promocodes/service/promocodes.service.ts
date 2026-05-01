import { Injectable } from '@nestjs/common';
import { ActivatePromocodeDto } from '../dto/activate-promocode.dto';
import { CreatePromocodeDto } from '../dto/create-promocode.dto';
import { UpdatePromocodeDto } from '../dto/update-promocode.dto';
import { PromocodesMapper } from '../mapper/promocodes.mapper';
import {
  activationLimitBelowUsageException,
  promocodeNotActivatableException,
  promocodeNotFoundException,
} from '../promocodes.errors';
import { PromocodesRepository } from '../repository/promocodes.repository';

@Injectable()
export class PromocodesService {
  constructor(
    private readonly promocodesRepository: PromocodesRepository,
    private readonly promocodesMapper: PromocodesMapper,
  ) {}

  async create(dto: CreatePromocodeDto) {
    const data = this.promocodesMapper.toCreateData(dto);

    return this.promocodesRepository.create(data);
  }

  findAll() {
    return this.promocodesRepository.findMany();
  }

  async findOne(code: string) {
    const promoCode = await this.promocodesRepository.findByCode(
      this.promocodesMapper.normalizeCode(code),
    );

    if (!promoCode) {
      throw promocodeNotFoundException();
    }

    return promoCode;
  }

  async update(code: string, dto: UpdatePromocodeDto) {
    const normalizedCode = this.promocodesMapper.normalizeCode(code);
    const data = this.promocodesMapper.toUpdateData(dto);

    if (dto.activationLimit === undefined) {
      return this.promocodesRepository.update(normalizedCode, data);
    }

    await this.findOne(normalizedCode);

    const updated =
      await this.promocodesRepository.updateWithActivationLimitGuard(
        normalizedCode,
        data,
        dto.activationLimit,
      );

    if (!updated) {
      throw activationLimitBelowUsageException();
    }

    return updated;
  }

  async remove(code: string) {
    return this.promocodesRepository.delete(
      this.promocodesMapper.normalizeCode(code),
    );
  }

  async activate(code: string, dto: ActivatePromocodeDto) {
    const promoCode = await this.findOne(code);
    const email = this.promocodesMapper.normalizeEmail(dto.email);

    try {
      return await this.promocodesRepository.activate(promoCode, email);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'PROMOCODE_NOT_ACTIVATABLE'
      ) {
        throw promocodeNotActivatableException();
      }

      throw error;
    }
  }
}
