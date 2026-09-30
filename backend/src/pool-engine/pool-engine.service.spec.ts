import { Test, TestingModule } from '@nestjs/testing';
import { PoolEngineService } from './pool-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { FareCalculatorService } from '../fare-calculator/fare-calculator.service';
import { SyncService } from '../sync/sync.service';

describe('PoolEngineService', () => {
  let service: PoolEngineService;

  const mockPrisma = {
    rideRequest: { findUnique: jest.fn(), update: jest.fn() },
    pool: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    vehicle: { findFirst: jest.fn() },
    poolMember: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mockPrisma)),
  };

  const mockFare = {
    calculateFare: jest.fn().mockReturnValue({
      baseFare: 5000,
      distanceFare: 10000,
      discount: 3750,
      finalFare: 11250,
      distanceKm: 2.8,
      isPooled: true,
    }),
  };

  const mockSync = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FareCalculatorService, useValue: mockFare },
        { provide: SyncService, useValue: mockSync },
      ],
    }).compile();

    service = module.get<PoolEngineService>(PoolEngineService);
  });

  it('should match Rafiq into Nusrat existing pool when corridor is compatible and seats available', async () => {
    mockPrisma.rideRequest.findUnique.mockResolvedValue({
      id: 'req-rafiq',
      passengerId: 'user-rafiq',
      pickupZone: 'BANANI',
      dropoffZone: 'GULSHAN_1',
      seatsRequested: 1,
      status: 'REQUESTED',
      passenger: { name: 'Rafiq' },
    });

    // Existing pool with Nusrat (1/3 seats occupied)
    mockPrisma.pool.findMany.mockResolvedValue([
      {
        id: 'pool-bullet',
        capacity: 3,
        occupiedSeats: 1,
        status: 'OPEN',
        poolMembers: [
          {
            rideRequest: {
              pickupZone: 'BANANI',
              dropoffZone: 'MOHAKHALI',
            },
          },
        ],
      },
    ]);

    mockPrisma.pool.findUnique = jest.fn().mockResolvedValue({
      id: 'pool-bullet',
      capacity: 3,
      occupiedSeats: 1,
      status: 'OPEN',
    });

    const result = await service.tryMatchRequest('req-rafiq');
    expect(result).toBe(true);
    expect(mockSync.emit).toHaveBeenCalledWith('POOL_MATCHED', expect.anything());
  });

  it('should reject matching if pool capacity would be exceeded (> 3 seats)', async () => {
    mockPrisma.rideRequest.findUnique.mockResolvedValue({
      id: 'req-shirin',
      pickupZone: 'BANANI',
      dropoffZone: 'MOHAKHALI',
      seatsRequested: 2, // Only 1 seat left, requests 2
      status: 'REQUESTED',
    });

    // Pool already has 2/3 seats full
    mockPrisma.pool.findMany.mockResolvedValue([
      {
        id: 'pool-bullet',
        capacity: 3,
        occupiedSeats: 2,
        status: 'OPEN',
        poolMembers: [],
      },
    ]);

    mockPrisma.vehicle.findFirst.mockResolvedValue(null); 

    const result = await service.tryMatchRequest('req-shirin');
    expect(result).toBe(false);
  });
});
