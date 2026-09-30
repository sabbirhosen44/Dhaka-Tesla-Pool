import { Test, TestingModule } from '@nestjs/testing';
import { PoolEngineService } from './pool-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { FareCalculatorService } from '../fare-calculator/fare-calculator.service';
import { SyncService } from '../sync/sync.service';
import { BadRequestException } from '@nestjs/common';

describe('PoolEngine - Concurrency & Lifecycle Integrity Tests (Section 12)', () => {
  let service: PoolEngineService;

  // Shared in-memory state simulating PostgreSQL row-level locks
  let poolDatabaseState: {
    id: string;
    capacity: number;
    occupiedSeats: number;
    status: string;
  };

  const mockFareCalculator = {
    calculateFare: jest.fn().mockReturnValue({
      baseFareP: 5000,
      distanceFareP: 10000,
      poolDiscountP: 3750,
      finalFareP: 11250,
    }),
  };

  const mockSyncService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    // Initial state: Bullet has 3 seats, Nusrat & Rafiq occupy 2 seats. EXACTLY 1 SEAT LEFT!
    poolDatabaseState = {
      id: 'bullet-pool-1',
      capacity: 3,
      occupiedSeats: 2,
      status: 'OPEN',
    };

    const mockPrisma = {
      rideRequest: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve({
            id: where.id,
            pickupZone: 'BANANI',
            dropoffZone: 'MOHAKHALI',
            seatsRequested: 1,
            status: 'REQUESTED',
            passenger: { name: where.id === 'req-shirin' ? 'Shirin' : 'Competitor' },
          });
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      pool: {
        findMany: jest.fn().mockImplementation(() => [
          {
            ...poolDatabaseState,
            vehicle: { isOnline: true },
            poolMembers: [
              {
                rideRequest: {
                  pickupZone: 'BANANI',
                  dropoffZone: 'MOHAKHALI',
                },
              },
            ],
          },
        ]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === poolDatabaseState.id) {
            return Promise.resolve({
              ...poolDatabaseState,
              driverId: 'jashim-uuid',
              poolMembers: [],
            });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(poolDatabaseState, data);
          return Promise.resolve(poolDatabaseState);
        }),
      },
      poolMember: {
        create: jest.fn().mockResolvedValue({}),
      },
      vehicle: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      // Simulating PostgreSQL ACID Transaction with Atomic Row-Level Lock Queue
      $transaction: jest.fn().mockImplementation((() => {
        let lockQueue = Promise.resolve();
        return async (callback: any) => {
          const runTx = lockQueue.then(async () => {
            const txPrisma = {
              pool: {
                findUnique: jest.fn().mockImplementation(() =>
                  Promise.resolve({ ...poolDatabaseState }),
                ),
                update: jest.fn().mockImplementation(({ data }) => {
                  Object.assign(poolDatabaseState, data);
                  return Promise.resolve(poolDatabaseState);
                }),
              },
              poolMember: {
                create: jest.fn().mockResolvedValue({}),
              },
              rideRequest: {
                update: jest.fn().mockResolvedValue({}),
              },
            };
            return callback(txPrisma);
          });
          lockQueue = runTx.catch(() => {});
          return runTx;
        };
      })()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FareCalculatorService, useValue: mockFareCalculator },
        { provide: SyncService, useValue: mockSyncService },
      ],
    }).compile();

    service = module.get<PoolEngineService>(PoolEngineService);
  });

  describe('The Concurrency Problem: 1 seat left, 2 instant concurrent requests', () => {
    it('should strictly allow only 1 request to claim the last seat and reject the other, never exceeding capacity 3', async () => {
      expect(poolDatabaseState.occupiedSeats).toBe(2);
      expect(poolDatabaseState.capacity).toBe(3);

      // Shirin and another stranger fire requests at the exact same millisecond
      const [shirinResult, competitorResult] = await Promise.all([
        service.tryMatchRequest('req-shirin'),
        service.tryMatchRequest('req-competitor'),
      ]);

      // Exactly ONE request must succeed, and the other MUST be rejected
      const successCount = [shirinResult, competitorResult].filter(Boolean).length;
      expect(successCount).toBe(1);

      // CRITICAL ASSERTION: Bullet's occupied seats must be exactly 3, NEVER 4!
      expect(poolDatabaseState.occupiedSeats).toBe(3);
      expect(poolDatabaseState.status).toBe('FULL');
    });
  });

  describe('Lifecycle State Machine Transitions', () => {
    it('should reject invalid trip actions on completed rides', async () => {
      poolDatabaseState.status = 'COMPLETED';

      // Driver cannot START or ARRIVE on a completed ride
      await expect(
        service.handleDriverTripAction('jashim-uuid', 'bullet-pool-1', 'INVALID' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
