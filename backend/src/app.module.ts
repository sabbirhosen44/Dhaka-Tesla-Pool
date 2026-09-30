import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FareCalculatorModule } from './fare-calculator/fare-calculator.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { SyncModule } from './sync/sync.module';
import { RideRequestModule } from './ride-request/ride-request.module';
import { PoolEngineModule } from './pool-engine/pool-engine.module';

@Module({
  imports: [PrismaModule, FareCalculatorModule, AuthModule, VehicleModule, SyncModule, RideRequestModule, PoolEngineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
