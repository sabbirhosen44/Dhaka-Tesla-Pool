import { FareCalculatorService } from './fare-calculator.service';
import { areRoutesCompatible } from '../common/constants/dhaka-zones';

describe('FareCalculatorService', () => {
  let service: FareCalculatorService;

  beforeEach(() => {
    service = new FareCalculatorService();
  });

  describe('Nusrat Trip (Banani -> Mohakhali, 3.2 km)', () => {
    it('should calculate correct solo fare', () => {
      const result = service.calculateFare('BANANI', 'MOHAKHALI', false);

      expect(result.baseFare).toBe(5000);
      expect(result.distanceFare).toBe(8000);
      expect(result.discount).toBe(0);
      expect(result.finalFare).toBe(13000);
    });

    it('should apply 25% pool discount when shared', () => {
      const result = service.calculateFare('BANANI', 'MOHAKHALI', true);

      expect(result.baseFare).toBe(5000);
      expect(result.distanceFare).toBe(8000);
      expect(result.discount).toBe(3250);
      expect(result.finalFare).toBe(9750);
    });
  });

  describe('Rafiq Trip (Banani -> Gulshan 1, 2.8 km)', () => {
    it('should calculate correct pooled fare', () => {
      const result = service.calculateFare('BANANI', 'GULSHAN_1', true);

      expect(result.baseFare).toBe(5000);
      expect(result.distanceFare).toBe(7000);
      expect(result.discount).toBe(3000);
      expect(result.finalFare).toBe(9000);
    });
  });

  describe('Corridor Matching Compatibility', () => {
    it('should identify Nusrat and Rafiq as compatible (same pickup, same corridor, 0.4km detour)', () => {
      const compatible = areRoutesCompatible('BANANI', 'MOHAKHALI', 'BANANI', 'GULSHAN_1');
      expect(compatible).toBe(true);
    });

    it('should reject different pickup zones', () => {
      const compatible = areRoutesCompatible('BANANI', 'MOHAKHALI', 'MIRPUR', 'DHANMONDI');
      expect(compatible).toBe(false);
    });

    it('should reject same pickup but different corridors (Banani->Mohakhali vs Banani->Mirpur)', () => {
      const compatible = areRoutesCompatible('BANANI', 'MOHAKHALI', 'BANANI', 'MIRPUR');
      expect(compatible).toBe(false);
    });

    it('should reject same pickup, same corridor but excessive detour > 3km', () => {
      const compatible = areRoutesCompatible('BANANI', 'GULSHAN_2', 'BANANI', 'UTTARA');
      expect(compatible).toBe(false);
    });
  });

});
