import { Module, forwardRef } from '@nestjs/common';
import { PoolEngineService } from './pool-engine.service';
import { PoolEngineController } from './pool-engine.controller';
import { FareCalculatorModule } from '../fare-calculator/fare-calculator.module';
import { RideRequestModule } from '../ride-request/ride-request.module';

@Module({
  imports: [FareCalculatorModule, forwardRef(() => RideRequestModule)],
  controllers: [PoolEngineController],
  providers: [PoolEngineService],
  exports: [PoolEngineService],
})
export class PoolEngineModule {}
