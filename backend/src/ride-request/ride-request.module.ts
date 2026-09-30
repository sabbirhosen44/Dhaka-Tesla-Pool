import { Module, forwardRef } from '@nestjs/common';
import { RideRequestService } from './ride-request.service';
import { RideRequestController } from './ride-request.controller';
import { PoolEngineModule } from '../pool-engine/pool-engine.module';

@Module({
  imports: [forwardRef(() => PoolEngineModule)],
  controllers: [RideRequestController],
  providers: [RideRequestService],
  exports: [RideRequestService],
})
export class RideRequestModule {}
