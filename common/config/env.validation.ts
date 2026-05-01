import { plainToInstance } from 'class-transformer';

import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumber()
  APP_PORT: number;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsNumber()
  THROTTLE_TTL_MS: number;

  @IsOptional()
  @IsNumber()
  THROTTLE_LIMIT: number;

  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsIn(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
  LOG_LEVEL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      APP_PORT: 3000,
      THROTTLE_TTL_MS: 60_000,
      THROTTLE_LIMIT: 100,
      ...config,
    },
    {
      enableImplicitConversion: true,
    },
  );
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
