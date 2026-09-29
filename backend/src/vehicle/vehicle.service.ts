import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all registered vehicles
   */
  async getAllVehicles(isOnlineOnly?: boolean) {
    return this.prisma.vehicle.findMany({
      where: isOnlineOnly !== undefined ? { isOnline: isOnlineOnly } : undefined,
      include: {
        driver: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
