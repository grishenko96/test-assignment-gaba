import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePromocodeDto } from '../dto/create-promocode.dto';
import { UpdatePromocodeDto } from '../dto/update-promocode.dto';
import {
  noPromocodeFieldsToUpdateException,
  promocodeCodeRequiredException,
} from '../promocodes.errors';

@Injectable()
export class PromocodesMapper {
  toCreateData(dto: CreatePromocodeDto): Prisma.PromoCodeCreateInput {
    return {
      code: this.normalizeCode(dto.code),
      discountPercent: dto.discountPercent,
      activationLimit: dto.activationLimit,
      expiresAt: new Date(dto.expiresAt),
    };
  }

  toUpdateData(dto: UpdatePromocodeDto): Prisma.PromoCodeUpdateInput {
    const data: Prisma.PromoCodeUpdateInput = {};

    if (dto.code !== undefined) {
      data.code = this.normalizeCode(dto.code);
    }
    if (dto.discountPercent !== undefined) {
      data.discountPercent = dto.discountPercent;
    }
    if (dto.activationLimit !== undefined) {
      data.activationLimit = dto.activationLimit;
    }
    if (dto.expiresAt !== undefined) {
      data.expiresAt = new Date(dto.expiresAt);
    }

    if (Object.keys(data).length === 0) {
      throw noPromocodeFieldsToUpdateException();
    }

    return data;
  }

  normalizeCode(code: string): string {
    const normalized = code.trim().toUpperCase();

    if (normalized.length === 0) {
      throw promocodeCodeRequiredException();
    }

    return normalized;
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
