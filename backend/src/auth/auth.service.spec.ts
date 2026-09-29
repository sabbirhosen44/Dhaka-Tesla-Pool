import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should issue JWT for Nusrat login', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'nusrat-uuid',
      name: 'Nusrat',
      phone: '+8801711000002',
      role: 'PASSENGER',
      walletBalanceP: 80000,
      vehicles: [],
    });

    const result = await service.demoLogin({ name: 'Nusrat' });
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.name).toBe('Nusrat');
    expect(result.user.role).toBe('PASSENGER');
  });

  it('should issue JWT for Jashim (Driver)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'jashim-uuid',
      name: 'Jashim',
      phone: '+8801711000001',
      role: 'DRIVER',
      walletBalanceP: 100000,
      vehicles: [{ id: 'bullet-uuid', model: 'Bullet', capacity: 3, isOnline: true }],
    });

    const result = await service.demoLogin({ name: 'Jashim' });
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.role).toBe('DRIVER');
    expect(result.user.vehicle?.model).toBe('Bullet');
  });
});
