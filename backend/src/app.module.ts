import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PrismaModule } from './prisma/prisma.module';
import { FareCalculatorModule } from './fare-calculator/fare-calculator.module';

@Module({
  imports: [PrismaModule, FareCalculatorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
