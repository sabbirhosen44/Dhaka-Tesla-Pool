import { Test, TestingModule } from '@nestjs/testing';
import { FareCalculatorController } from './fare-calculator.controller';

describe('FareCalculatorController', () => {
  let controller: FareCalculatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FareCalculatorController],
    }).compile();

    controller = module.get<FareCalculatorController>(FareCalculatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
