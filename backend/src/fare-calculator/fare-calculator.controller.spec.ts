import { Test, TestingModule } from '@nestjs/testing';
import { FareCalculatorController } from './fare-calculator.controller';
import { FareCalculatorService } from './fare-calculator.service';

describe('FareCalculatorController', () => {
  let controller: FareCalculatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FareCalculatorController],
      providers: [FareCalculatorService],
    }).compile();

    controller = module.get<FareCalculatorController>(FareCalculatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
