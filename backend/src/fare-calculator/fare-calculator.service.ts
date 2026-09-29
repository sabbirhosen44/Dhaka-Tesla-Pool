import { Injectable } from '@nestjs/common';
import { ZONE_DISTANCES_KM } from '../common/constants/dhaka-zones';

export interface FareCalculationResult {
  baseFare: number;       // In poysha (1 BDT = 100 poysha)
  distanceFare: number;   // In poysha
  discount: number;       // In poysha
  finalFare: number;      // In poysha
  distanceKm: number;
  isPooled: boolean;
}

@Injectable()
export class FareCalculatorService {
  private readonly BASE_FARE_POYSHA = 5000; 
  private readonly RATE_PER_KM_POYSHA = 2500; 
  private readonly POOL_DISCOUNT_PERCENTAGE = 25;

  calculateFare(
    pickupZone: string,
    dropoffZone: string,
    isPooled: boolean = false,
  ): FareCalculationResult {
    const pickup = pickupZone.toUpperCase();
    const dropoff = dropoffZone.toUpperCase();

    const distanceKm =
      ZONE_DISTANCES_KM[pickup]?.[dropoff] ??
      ZONE_DISTANCES_KM[dropoff]?.[pickup] ??
      3.0;

    const baseFare = this.BASE_FARE_POYSHA;
    const distanceFare = Math.round(distanceKm * this.RATE_PER_KM_POYSHA);
    const subtotal = baseFare + distanceFare;

    const discount = isPooled
      ? Math.round((subtotal * this.POOL_DISCOUNT_PERCENTAGE) / 100)
      : 0;

    const finalFare = subtotal - discount;

    return {
      baseFare,
      distanceFare,
      discount,
      finalFare,
      distanceKm,
      isPooled,
    };
  }
}
