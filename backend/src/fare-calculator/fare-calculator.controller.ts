import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FareCalculatorService } from './fare-calculator.service';
import type { FareCalculationResult } from './fare-calculator.service';
import { EstimateFareDto } from './dto/estimate-fare.dto';

@ApiTags('Fare Engine')
@Controller('fare')
export class FareCalculatorController {
  constructor(private readonly fareService: FareCalculatorService) {}

  @Get('estimate')
  @ApiOperation({ summary: 'Calculate estimated fare breakdown in integer poysha' })
  @ApiResponse({ status: 200, description: 'Fare estimation breakdown in poysha' })
  estimateFare(@Query() query: EstimateFareDto): FareCalculationResult {
  return this.fareService.calculateFare(
    query.pickupZone,
    query.dropoffZone,
    query.isPooled ?? false,
  );
}
}
