import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DHAKA_ZONES } from '../common/constants/dhaka-zones';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all registered vehicles with real-time dynamic capacity and occupancy
   */
  async getAllVehicles(isOnlineOnly?: boolean) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: isOnlineOnly !== undefined ? { isOnline: isOnlineOnly } : undefined,
      include: {
        driver: {
          select: { id: true, name: true, phone: true, role: true },
        },
        pools: {
          where: {
            status: { in: ['OPEN', 'FULL', 'ACTIVE'] },
          },
          include: {
            poolMembers: {
              include: {
                rideRequest: {
                  select: {
                    id: true,
                    pickupZone: true,
                    dropoffZone: true,
                    passenger: {
                      select: { id: true, name: true, phone: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((v) => {
      const activePool = v.pools?.[0];
      const occupiedSeats = activePool ? activePool.occupiedSeats : 0;
      const availableSeats = Math.max(0, v.capacity - occupiedSeats);
      const firstMember = activePool?.poolMembers?.[0]?.rideRequest;
      const activeCorridor = firstMember
        ? DHAKA_ZONES[firstMember.dropoffZone]?.corridor || 'CENTRAL_CONNECT'
        : null;

      return {
        id: v.id,
        driverId: v.driverId,
        model: v.model,
        capacity: v.capacity,
        occupiedSeats,
        availableSeats,
        isOnline: v.isOnline,
        createdAt: v.createdAt,
        driver: v.driver,
        activePool: activePool
          ? {
              id: activePool.id,
              status: activePool.status,
              occupiedSeats: activePool.occupiedSeats,
              capacity: activePool.capacity,
              corridor: activeCorridor,
              passengers: activePool.poolMembers.map((m) => ({
                id: m.id,
                passengerName: m.rideRequest.passenger.name,
                pickupZone: m.rideRequest.pickupZone,
                dropoffZone: m.rideRequest.dropoffZone,
                seatsAllocated: m.seatsAllocated,
              })),
            }
          : null,
      };
    });
  }

  /**
   * Get a specific vehicle by ID
   */
  async getVehicleById(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    return vehicle;
  }

  /**
   * Get the primary EV "Bullet" assigned to driver Jashim
   */
  async getBulletVehicle() {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { model: 'Bullet' },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Bullet vehicle not found in database');
    }

    return vehicle;
  }

  /**
   * Get vehicle belonging to a specific driver ID
   */
  async getVehicleByDriverId(driverId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { driverId },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`No vehicle registered for driver ${driverId}`);
    }

    return vehicle;
  }

  /**
   * Live Manifest: Dynamic calculation for ANY vehicle!
   */
  async getVehicleManifest(vehicleId?: string) {
    const vehicle = vehicleId
      ? await this.getVehicleById(vehicleId)
      : await this.getBulletVehicle();

    // Query active pool for this vehicle
    const activePool = await this.prisma.pool.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: { in: ['OPEN', 'FULL', 'ACTIVE'] },
      },
      include: {
        poolMembers: {
          include: {
            rideRequest: {
              include: {
                passenger: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Dynamic capacity math based on this specific vehicle's capacity
    const capacity = vehicle.capacity;
    const occupiedSeats = activePool ? activePool.occupiedSeats : 0;
    const availableSeats = Math.max(0, capacity - occupiedSeats);

    const passengers = activePool
      ? activePool.poolMembers.map((member) => ({
          memberId: member.id,
          rideRequestId: member.rideRequestId,
          passengerName: member.rideRequest.passenger.name,
          passengerPhone: member.rideRequest.passenger.phone,
          pickupZone: member.rideRequest.pickupZone,
          dropoffZone: member.rideRequest.dropoffZone,
          seatsAllocated: member.seatsAllocated,
          finalFarePoysha: member.finalFare,
          finalFareBDT: (member.finalFare / 100).toFixed(2),
          status: member.rideRequest.status,
          joinedAt: member.joinedAt,
        }))
      : [];

    return {
      vehicleId: vehicle.id,
      model: vehicle.model,
      capacity,
      occupiedSeats,
      availableSeats,
      isOnline: vehicle.isOnline,
      driver: vehicle.driver,
      poolId: activePool?.id || null,
      poolStatus: activePool?.status || 'IDLE',
      passengers,
    };
  }

  /**
   * Toggle vehicle online/offline status
   */
  async updateStatus(vehicleId: string, isOnline: boolean) {
    await this.getVehicleById(vehicleId);

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isOnline },
      include: {
        driver: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
