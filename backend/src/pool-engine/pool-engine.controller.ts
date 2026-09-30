import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PoolEngineService } from './pool-engine.service';
import { TripActionDto } from './dto/trip-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import type { AuthUserPayload } from '../auth/decorators/current-user/current-user.decorator';

@ApiTags('Driver & Pool Lifecycle')
@Controller('pools')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PoolEngineController {
  constructor(private readonly poolEngine: PoolEngineService) {}

  @Get('active')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Jashim gets active Bullet pool with passenger manifest' })
  @ApiResponse({ status: 200, description: 'Active pool details' })
  getActivePool(@CurrentUser() user: AuthUserPayload) {
    return this.poolEngine.getActivePoolForDriver(user.id);
  }

  @Post(':id/action')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver executes lifecycle action: ARRIVE | START | COMPLETE' })
  @ApiResponse({ status: 200, description: 'Trip status updated successfully' })
  handleAction(
    @Param('id') poolId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: TripActionDto,
  ) {
    return this.poolEngine.handleDriverTripAction(user.id, poolId, dto.action);
  }
}
