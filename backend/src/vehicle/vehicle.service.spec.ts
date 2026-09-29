import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from './vehicle.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VehicleService', () => {
  let service: VehicleService;

  const mockPrisma = {
    vehicle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pool: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
  });

  it('should dynamically calculate available seats for ANY 3-seat vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'any-tesla-id',
      model: 'Bullet',
      capacity: 3,
      isOnline: true,
      driver: { id: 'jashim-uuid', name: 'Jashim', phone: '+8801711000001' },
    });

    // 2 seats occupied (Nusrat & Rafiq)
    mockPrisma.pool.findFirst.mockResolvedValue({
      id: 'pool-uuid',
      occupiedSeats: 2,
      status: 'OPEN',
      poolMembers: [
        {
          id: 'pm-1',
          rideRequestId: 'req-nusrat',
          seatsAllocated: 1,
          finalFare: 11250,
          joinedAt: new Date(),
          rideRequest: {
            status: 'MATCHED',
            pickupZone: 'BANANI',
            dropoffZone: 'MOHAKHALI',
            passenger: { name: 'Nusrat', phone: '+8801711000002' },
          },
        },
        {
          id: 'pm-2',
          rideRequestId: 'req-rafiq',
          seatsAllocated: 1,
          finalFare: 10500,
          joinedAt: new Date(),
          rideRequest: {
            status: 'MATCHED',
            pickupZone: 'BANANI',
            dropoffZone: 'GULSHAN_1',
            passenger: { name: 'Rafiq', phone: '+8801711000003' },
          },
        },
      ],
    });

    const manifest = await service.getVehicleManifest('any-tesla-id');

    expect(manifest.capacity).toBe(3);
    expect(manifest.occupiedSeats).toBe(2);
    expect(manifest.availableSeats).toBe(1); // 3 - 2 = 1 seat remaining
    expect(manifest.passengers.length).toBe(2);
    expect(manifest.passengers[0].passengerName).toBe('Nusrat');
    expect(manifest.passengers[1].passengerName).toBe('Rafiq');
  });

  it('should toggle online/offline status for a vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'any-tesla-id',
      model: 'Bullet',
      isOnline: true,
    });

    mockPrisma.vehicle.update.mockResolvedValue({
      id: 'any-tesla-id',
      model: 'Bullet',
      isOnline: false,
      driver: { id: 'jashim-uuid', name: 'Jashim' },
    });

    const result = await service.updateStatus('any-tesla-id', false);
    expect(result.isOnline).toBe(false);
  });
});
