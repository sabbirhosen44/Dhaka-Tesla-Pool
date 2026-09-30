import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { DHAKA_ZONES } from '../common/constants/dhaka-zones';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { PoolEngineService } from '../pool-engine/pool-engine.service';

@Injectable()
export class RideRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
    @Inject(forwardRef(() => PoolEngineService))
    private readonly poolEngine: PoolEngineService,
  ) {}

  /**
   * Passenger books a ride request
   */
  async createRideRequest(passengerId: string, dto: CreateRideRequestDto) {
    const pZone = dto.pickupZone.toUpperCase();
    const dZone = dto.dropoffZone.toUpperCase();

    if (!DHAKA_ZONES[pZone]) {
      throw new BadRequestException(`Unknown pickup zone: ${dto.pickupZone}`);
    }
    if (!DHAKA_ZONES[dZone]) {
      throw new BadRequestException(`Unknown dropoff zone: ${dto.dropoffZone}`);
    }
    if (pZone === dZone) {
      throw new BadRequestException('Pickup and dropoff zones cannot be identical');
    }

    const seatsRequested = dto.seatsRequested || 1;

    // 1. Create ride request
    const rideRequest = await this.prisma.rideRequest.create({
      data: {
        passengerId,
        pickupZone: pZone,
        dropoffZone: dZone,
        seatsRequested,
        status: 'REQUESTED',
        eventLogs: {
          create: {
            fromStatus: 'NONE',
            toStatus: 'REQUESTED',
            note: `Ride requested for ${seatsRequested} seat(s) from ${pZone} to ${dZone}`,
          },
        },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });

    // 2. Broadcast via SSE
    this.syncService.emit('RIDE_REQUESTED', {
      requestId: rideRequest.id,
      passengerName: rideRequest.passenger.name,
      pickupZone: pZone,
      dropoffZone: dZone,
      seats: seatsRequested,
    });

    // 3. Immediately attempt to match into an available Tesla pool
    await this.poolEngine.tryMatchRequest(rideRequest.id, dto.preferredVehicleId);

    return this.getRideRequestById(rideRequest.id, passengerId, 'PASSENGER');
  }

  /**
   * View ride request with individual fare isolation
   */
  async getRideRequestById(requestId: string, userId: string, role: string) {
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        poolMember: {
          include: {
            pool: {
              include: {
                vehicle: { select: { id: true, model: true, capacity: true } },
                driver: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        eventLogs: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Ride request ${requestId} not found`);
    }

    // Privacy Isolation: A passenger CANNOT view another passenger's ride!
    if (role === 'PASSENGER' && request.passengerId !== userId) {
      throw new ForbiddenException('You are not authorized to view another passenger’s ride');
    }

    const zoneInfo = DHAKA_ZONES[request.dropoffZone];
    const fareInPoysha = request.poolMember ? request.poolMember.finalFare : 0;
    const corridor = zoneInfo?.corridor || 'CENTRAL_CONNECT';

    return {
      id: request.id,
      status: request.status,
      pickupZone: request.pickupZone,
      dropoffZone: request.dropoffZone,
      seatsRequested: request.seatsRequested,
      fareInPoysha,
      corridor,
      passenger: request.passenger,
      pool: request.poolMember
        ? {
            poolId: request.poolMember.poolId,
            poolStatus: request.poolMember.pool.status,
            corridor,
            vehicle: request.poolMember.pool.vehicle,
            driver: request.poolMember.pool.driver,
            // Individual fare receipt in Poysha and BDT
            myFarePoysha: request.poolMember.finalFare,
            myFareBDT: (request.poolMember.finalFare / 100).toFixed(2),
            baseFarePoysha: request.poolMember.baseFare,
            distanceFarePoysha: request.poolMember.distanceFare,
            discountPoysha: request.poolMember.discount,
            paymentStatus: request.poolMember.paymentStatus,
          }
        : null,
      timeline: request.eventLogs.map((log) => ({
        status: log.toStatus,
        note: log.note,
        time: log.timestamp,
      })),
      createdAt: request.createdAt,
    };
  }

  /**
   * Cancel ride request while in valid state (REQUESTED or MATCHED)
   */
  async cancelRideRequest(requestId: string, userId: string) {
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { poolMember: true },
    });

    if (!request) {
      throw new NotFoundException('Ride request not found');
    }

    if (request.passengerId !== userId) {
      throw new ForbiddenException('Cannot cancel another passenger’s ride');
    }

    if (request.status === 'STARTED' || request.status === 'COMPLETED') {
      throw new BadRequestException(`Cannot cancel ride when status is ${request.status}`);
    }

    // Atomic cancel and pool seat decrement
    await this.prisma.$transaction(async (tx) => {
      if (request.poolMember) {
        await tx.pool.update({
          where: { id: request.poolMember.poolId },
          data: {
            occupiedSeats: { decrement: request.seatsRequested },
            status: 'OPEN',
          },
        });
        await tx.poolMember.delete({ where: { id: request.poolMember.id } });
      }

      await tx.rideRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
          eventLogs: {
            create: {
              fromStatus: request.status,
              toStatus: 'CANCELLED',
              note: 'Ride cancelled by passenger',
            },
          },
        },
      });
    });

    this.syncService.emit('RIDE_CANCELLED', { requestId, passengerId: userId });

    return { message: 'Ride successfully cancelled', requestId };
  }

  /**
   * Passenger ride history
   */
  async getPassengerHistory(passengerId: string) {
    const list = await this.prisma.rideRequest.findMany({
      where: { passengerId },
      include: {
        poolMember: {
          include: {
            pool: {
              include: {
                vehicle: true,
                driver: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((request) => {
      const zoneInfo = DHAKA_ZONES[request.dropoffZone];
      const fareInPoysha = request.poolMember?.finalFare ?? 0;
      const corridor = zoneInfo?.corridor ?? 'CENTRAL_CONNECT';
      return {
        ...request,
        fareInPoysha,
        corridor,
        pool: request.poolMember
          ? {
              ...request.poolMember.pool,
              corridor,
              myFarePoysha: fareInPoysha,
              myFareBDT: (fareInPoysha / 100).toFixed(2),
            }
          : null,
      };
    });
  }
}
