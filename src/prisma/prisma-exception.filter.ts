import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

type PrismaErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  fields?: string[];
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const errorResponse = this.toErrorResponse(exception);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private toErrorResponse(
    exception: Prisma.PrismaClientKnownRequestError,
  ): PrismaErrorResponse {
    if (exception.code === 'P2002') {
      return this.toUniqueConstraintResponse(exception);
    }

    if (exception.code === 'P2025') {
      return {
        statusCode: 404,
        code: 'RECORD_NOT_FOUND',
        message: 'Requested record was not found',
      };
    }

    return {
      statusCode: 500,
      code: 'DATABASE_REQUEST_FAILED',
      message: 'Database request failed',
    };
  }

  private toUniqueConstraintResponse(
    exception: Prisma.PrismaClientKnownRequestError,
  ): PrismaErrorResponse {
    const fields = this.getTargetFields(exception);

    if (fields.includes('code')) {
      return {
        statusCode: 409,
        code: 'PROMOCODE_CODE_ALREADY_EXISTS',
        message: 'Promocode with this code already exists',
        fields,
      };
    }

    if (fields.includes('promoCodeId') && fields.includes('email')) {
      return {
        statusCode: 409,
        code: 'PROMOCODE_ALREADY_ACTIVATED',
        message: 'This email has already activated this promocode',
        fields: ['email'],
      };
    }

    return {
      statusCode: 409,
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      message: 'Unique constraint violation',
      fields,
    };
  }

  private getTargetFields(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string[] {
    const target = exception.meta?.target;

    if (Array.isArray(target)) {
      return target.filter(
        (field): field is string => typeof field === 'string',
      );
    }

    return [];
  }
}
