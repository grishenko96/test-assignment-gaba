import { Injectable } from '@nestjs/common';
import { Prisma, PromoCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromocodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PromoCodeCreateInput) {
    return this.prisma.promoCode.create({ data });
  }

  findMany() {
    return this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findByCode(code: string) {
    return this.prisma.promoCode.findUnique({ where: { code } });
  }

  update(code: string, data: Prisma.PromoCodeUpdateInput) {
    return this.prisma.promoCode.update({
      where: { code },
      data,
    });
  }

  async updateWithActivationLimitGuard(
    code: string,
    data: Prisma.PromoCodeUpdateInput,
    activationLimit: number,
  ) {
    const updated = await this.prisma.promoCode.updateMany({
      where: {
        code,
        activationsCount: { lte: activationLimit },
      },
      data,
    });

    if (updated.count !== 1) {
      return null;
    }

    return this.findByCode(code);
  }

  delete(code: string) {
    return this.prisma.promoCode.delete({ where: { code } });
  }

  activate(promoCode: PromoCode, email: string) {
    return this.prisma.$transaction(async (tx) => {
      const activation = await tx.activation.create({
        data: {
          promoCodeId: promoCode.id,
          email,
        },
      });

      const updated = await tx.promoCode.updateMany({
        where: {
          id: promoCode.id,
          activationsCount: { lt: tx.promoCode.fields.activationLimit },
          expiresAt: { gt: new Date() },
        },
        data: {
          activationsCount: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new Error('PROMOCODE_NOT_ACTIVATABLE');
      }

      return activation;
    });
  }
}
