import { BadRequestException, ValidationError } from '@nestjs/common';

type ValidationErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  errors: Array<{
    field: string;
    messages: string[];
  }>;
};

export function validationExceptionFactory(errors: ValidationError[]) {
  const response: ValidationErrorResponse = {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: errors.map((error) => ({
      field: error.property,
      messages: Object.values(error.constraints ?? {}),
    })),
  };

  return new BadRequestException(response);
}
