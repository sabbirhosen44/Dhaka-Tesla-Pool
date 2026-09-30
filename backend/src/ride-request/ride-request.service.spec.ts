import { Test, TestingModule } from '@nestjs/testing';
import { RideRequestService } from './ride-request.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { PoolEngineService } from '../pool-engine/pool-engine.service';
import { ForbiddenException } from '@nestjs/common';

describe('RideRequestService', () => {
  let service: RideRequestService;

  const mockPrisma = {
    rideRequest: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideRequestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SyncService, useValue: { emit: jest.fn() } },
        { provide: PoolEngineService, useValue: { tryMatchRequest: jest.fn() } },
      ],
    }).compile();

    service = module.get<RideRequestService>(RideRequestService);
  });

  it('should throw ForbiddenException if a passenger tries to view another passenger’s ride', async () => {
    mockPrisma.rideRequest.findUnique.mockResolvedValue({
      id: 'req-nusrat',
      passengerId: 'user-nusrat-id',
      eventLogs: [],
    });

    // Rafiq tries to access Nusrat's ride
    await expect(
      service.getRideRequestById('req-nusrat', 'user-rafiq-id', 'PASSENGER'),
    ).rejects.toThrow(ForbiddenException);
  });
});
