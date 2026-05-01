import {
  BadRequestException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';

export function promocodeNotFoundException() {
  return new NotFoundException({
    statusCode: 404,
    code: 'PROMOCODE_NOT_FOUND',
    message: 'Promocode not found',
  });
}

export function promocodeNotActivatableException() {
  return new GoneException({
    statusCode: 410,
    code: 'PROMOCODE_NOT_ACTIVATABLE',
    message: 'Promocode expired or activation limit reached',
  });
}

export function noPromocodeFieldsToUpdateException() {
  return new BadRequestException({
    statusCode: 400,
    code: 'NO_PROMOCODE_FIELDS_TO_UPDATE',
    message: 'No fields to update',
  });
}

export function promocodeCodeRequiredException() {
  return new BadRequestException({
    statusCode: 400,
    code: 'PROMOCODE_CODE_REQUIRED',
    message: 'Code is required',
    fields: ['code'],
  });
}

export function activationLimitBelowUsageException() {
  return new BadRequestException({
    statusCode: 400,
    code: 'ACTIVATION_LIMIT_BELOW_USAGE',
    message: 'Activation limit cannot be lower than current activations count',
    fields: ['activationLimit'],
  });
}
