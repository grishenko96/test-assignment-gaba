import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ActivatePromocodeDto } from '../dto/activate-promocode.dto';
import { CreatePromocodeDto } from '../dto/create-promocode.dto';
import { UpdatePromocodeDto } from '../dto/update-promocode.dto';
import { PromocodesService } from '../service/promocodes.service';

@ApiTags('promocodes')
@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @ApiOperation({ summary: 'Create promocode' })
  @ApiCreatedResponse({ description: 'Promocode created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Promocode code already exists' })
  @Post()
  create(@Body() dto: CreatePromocodeDto) {
    return this.promocodesService.create(dto);
  }

  @ApiOperation({ summary: 'List promocodes' })
  @ApiOkResponse({ description: 'Promocodes list' })
  @Get()
  findAll() {
    return this.promocodesService.findAll();
  }

  @ApiOperation({ summary: 'Get promocode by code' })
  @ApiOkResponse({ description: 'Promocode found' })
  @ApiNotFoundResponse({ description: 'Promocode not found' })
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.promocodesService.findOne(code);
  }

  @ApiOperation({ summary: 'Update promocode by code' })
  @ApiOkResponse({ description: 'Promocode updated' })
  @ApiBadRequestResponse({ description: 'Validation or domain error' })
  @ApiNotFoundResponse({ description: 'Promocode not found' })
  @ApiConflictResponse({ description: 'Promocode code already exists' })
  @Patch(':code')
  update(@Param('code') code: string, @Body() dto: UpdatePromocodeDto) {
    return this.promocodesService.update(code, dto);
  }

  @ApiOperation({ summary: 'Delete promocode by code' })
  @ApiOkResponse({ description: 'Promocode deleted' })
  @ApiNotFoundResponse({ description: 'Promocode not found' })
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.promocodesService.remove(code);
  }

  @ApiOperation({ summary: 'Activate promocode for email' })
  @ApiCreatedResponse({ description: 'Promocode activated' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Promocode not found' })
  @ApiConflictResponse({
    description: 'Email already activated this promocode',
  })
  @ApiGoneResponse({
    description: 'Promocode expired or activation limit reached',
  })
  @Post(':code/activate')
  activate(@Param('code') code: string, @Body() dto: ActivatePromocodeDto) {
    return this.promocodesService.activate(code, dto);
  }
}
