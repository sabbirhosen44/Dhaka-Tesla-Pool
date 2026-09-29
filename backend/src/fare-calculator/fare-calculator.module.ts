import { Module } from '@nestjs/common';
import { FareCalculatorService } from './fare-calculator.service';
import { FareCalculatorController } from './fare-calculator.controller';

@Module({
  controllers: [FareCalculatorController],
  providers: [FareCalculatorService],
  exports:[FareCalculatorService]
})
export class FareCalculatorModule {}
