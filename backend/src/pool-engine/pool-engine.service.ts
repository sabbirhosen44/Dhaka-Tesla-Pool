import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { FareCalculatorService } from '../fare-calculator/fare-calculator.service';
import { areRoutesCompatible } from '../common/constants/dhaka-zones';

@Injectable()
export class PoolEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fareCalculator: FareCalculatorService,
    private readonly syncService: SyncService,
  ) {}

  /**
 Matches a ride request to an existing compatible pool or creates a new one.
   */
  async tryMatchRequest(rideRequestId: string): Promise<boolean> {
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { passenger: true },
    });

    if (!request || request.status !== 'REQUESTED') {
      return false;
    }

    // Look for an existing OPEN pool on an online vehicle
    const openPools = await this.prisma.pool.findMany({
      where: {
        status: 'OPEN',
        vehicle: { isOnline: true },
      },
      include: {
        vehicle: true,
        poolMembers: {
          include: { rideRequest: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const pool of openPools) {
      const remainingSeats = pool.capacity - pool.occupiedSeats;
      if (remainingSeats < request.seatsRequested) {
        continue; 
      }

      // Check corridor compatibility with existing passengers
      const firstMember = pool.poolMembers[0];
      const isCompatible = firstMember
        ? areRoutesCompatible(
            firstMember.rideRequest.pickupZone,
            firstMember.rideRequest.dropoffZone,
            request.pickupZone,
            request.dropoffZone,
          )
        : true;

      if (!isCompatible) {
        continue;
      }

      // ATOMIC CONCURRENCY LOCK TRANSACTION
     
      const matched = await this.prisma.$transaction(async (tx) => {
        // Re-read pool with fresh state inside transaction
        const freshPool = await tx.pool.findUnique({
          where: { id: pool.id },
          include: { poolMembers: true },
        });

        if (!freshPool || freshPool.status !== 'OPEN') {
          return false;
        }

        if (freshPool.occupiedSeats + request.seatsRequested > freshPool.capacity) {
          return false;
        }

        // Calculate 25% discounted pooled fare in integer poysha
        const fare = this.fareCalculator.calculateFare(
          request.pickupZone,
          request.dropoffZone,
          true,
        );

        // Add passenger as PoolMember
        await tx.poolMember.create({
          data: {
            poolId: freshPool.id,
            rideRequestId: request.id,
            seatsAllocated: request.seatsRequested,
            baseFare: fare.baseFareP,
            distanceFare: fare.distanceFareP,
            discount: fare.poolDiscountP,
            finalFare: fare.finalFareP,
          },
        });

        const newOccupied = freshPool.occupiedSeats + request.seatsRequested;
        const newStatus = newOccupied >= freshPool.capacity ? 'FULL' : 'OPEN';

        await tx.pool.update({
          where: { id: freshPool.id },
          data: {
            occupiedSeats: newOccupied,
            status: newStatus,
          },
        });

        await tx.rideRequest.update({
          where: { id: request.id },
          data: {
            status: 'MATCHED',
            eventLogs: {
              create: {
                fromStatus: 'REQUESTED',
                toStatus: 'MATCHED',
                note: `Matched to pool ${freshPool.id} (${newOccupied}/${freshPool.capacity} seats occupied)`,
              },
            },
          },
        });

        return true;
      });

      if (matched) {
        this.syncService.emit('POOL_MATCHED', {
          poolId: pool.id,
          requestId: request.id,
          passengerName: request.passenger.name,
        });
        return true;
      }
    }

    // No open pool found - Create a new pool on an available online vehicle 
    const availableVehicle = await this.prisma.vehicle.findFirst({
      where: {
        isOnline: true,
        pools: {
          none: {
            status: { in: ['OPEN', 'FULL', 'ACTIVE'] },
          },
        },
      },
      include: { driver: true },
    });

    if (!availableVehicle) {
      return false; 
    }

    await this.prisma.$transaction(async (tx) => {
      // Create new pool with vehicle's dynamic capacity
      const newPool = await tx.pool.create({
        data: {
          driverId: availableVehicle.driverId,
          vehicleId: availableVehicle.id,
          capacity: availableVehicle.capacity,
          occupiedSeats: request.seatsRequested,
          status: request.seatsRequested >= availableVehicle.capacity ? 'FULL' : 'OPEN',
        },
      });

      // Calculate initial pooled fare
      const fare = this.fareCalculator.calculateFare(
        request.pickupZone,
        request.dropoffZone,
        true,
      );

      await tx.poolMember.create({
        data: {
          poolId: newPool.id,
          rideRequestId: request.id,
          seatsAllocated: request.seatsRequested,
          baseFare: fare.baseFareP,
          distanceFare: fare.distanceFareP,
          discount: fare.poolDiscountP,
          finalFare: fare.finalFareP,
        },
      });

      await tx.rideRequest.update({
        where: { id: request.id },
        data: {
          status: 'MATCHED',
          eventLogs: {
            create: {
              fromStatus: 'REQUESTED',
              toStatus: 'MATCHED',
              note: `Initial passenger in new pool on ${availableVehicle.model}`,
            },
          },
        },
      });

      this.syncService.emit('POOL_MATCHED', {
        poolId: newPool.id,
        requestId: request.id,
        passengerName: request.passenger.name,
      });
    });

    return true;
  }

  /**
   * Driver lifecycle controls
   */
  async handleDriverTripAction(driverId: string, poolId: string, action: 'ARRIVE' | 'START' | 'COMPLETE') {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      include: { poolMembers: { include: { rideRequest: true } } },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    if (pool.driverId !== driverId) {
      throw new ForbiddenException('You are not the assigned driver for this pool');
    }

    let targetRequestStatus: string;
    let targetPoolStatus: string = pool.status;

    if (action === 'ARRIVE') {
      targetRequestStatus = 'DRIVER_ARRIVED';
      targetPoolStatus = 'ACTIVE';
    } else if (action === 'START') {
      targetRequestStatus = 'STARTED';
      targetPoolStatus = 'ACTIVE';
    } else if (action === 'COMPLETE') {
      targetRequestStatus = 'COMPLETED';
      targetPoolStatus = 'COMPLETED';
    } else {
      throw new BadRequestException('Invalid trip action');
    }

    // Atomic lifecycle state transition
    await this.prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id: poolId },
        data: { status: targetPoolStatus },
      });

      for (const member of pool.poolMembers) {
        await tx.rideRequest.update({
          where: { id: member.rideRequestId },
          data: {
            status: targetRequestStatus,
            eventLogs: {
              create: {
                fromStatus: member.rideRequest.status,
                toStatus: targetRequestStatus,
                note: `Driver executed trip action: ${action}`,
              },
            },
          },
        });
      }
    });

    const eventName =
      action === 'ARRIVE' ? 'DRIVER_ARRIVED' : action === 'START' ? 'TRIP_STARTED' : 'TRIP_COMPLETED';

    this.syncService.emit(eventName, { poolId, action, status: targetRequestStatus });

    return {
      poolId,
      action,
      poolStatus: targetPoolStatus,
      requestStatus: targetRequestStatus,
      passengersUpdated: pool.poolMembers.length,
    };
  }

  /**
   * Get active pool details for driver console
   */
  async getActivePoolForDriver(driverId: string) {
    return this.prisma.pool.findFirst({
      where: {
        driverId,
        status: { in: ['OPEN', 'FULL', 'ACTIVE'] },
      },
      include: {
        vehicle: true,
        poolMembers: {
          include: {
            rideRequest: {
              include: {
                passenger: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
