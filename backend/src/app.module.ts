import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FareCalculatorModule } from './fare-calculator/fare-calculator.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';

@Module({
  imports: [PrismaModule, FareCalculatorModule, AuthModule, VehicleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
