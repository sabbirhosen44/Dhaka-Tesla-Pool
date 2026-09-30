import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { DemoLoginDto } from './dto/demo-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getStoryActors() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        walletBalanceP: true,
        vehicles: {
          select: {
            id: true,
            model: true,
            capacity: true,
            isOnline: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });
  }


  async demoLogin(dto: DemoLoginDto) {
    const actorName = dto.name || dto.actorName;
    if (!dto.phone && !actorName) {
      throw new BadRequestException('Provide either phone, name, or actorName for demo login');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.phone ? { phone: dto.phone } : undefined,
          actorName ? { name: { equals: actorName, mode: 'insensitive' } } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        vehicles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Actor not found in seed database');
    }

    const payload = {
      sub: user.id,
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalanceP: user.walletBalanceP,
        vehicle: user.vehicles[0] || null,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vehicles: true },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
