import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RideRequestService } from './ride-request.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import type { AuthUserPayload } from '../auth/decorators/current-user/current-user.decorator';

@ApiTags('Passenger Ride Requests')
@Controller('ride-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RideRequestController {
  constructor(private readonly rideRequestService: RideRequestService) {}

  @Post()
  @Roles('PASSENGER')
  @ApiOperation({ summary: 'Passenger requests a ride (Banani -> Mohakhali / Gulshan 1)' })
  @ApiResponse({ status: 201, description: 'Ride request created and matched' })
  createRequest(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateRideRequestDto,
  ) {
    return this.rideRequestService.createRideRequest(user.id, dto);
  }

  @Get('my-history')
  @Roles('PASSENGER')
  @ApiOperation({ summary: 'Get trip history for logged-in passenger' })
  getMyHistory(@CurrentUser() user: AuthUserPayload) {
    return this.rideRequestService.getPassengerHistory(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View ride request status & individual isolated fare' })
  getRequest(
    @Param('id') requestId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.rideRequestService.getRideRequestById(requestId, user.id, user.role);
  }

  @Post(':id/cancel')
  @Roles('PASSENGER')
  @ApiOperation({ summary: 'Cancel ride request while valid' })
  cancelRequest(
    @Param('id') requestId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.rideRequestService.cancelRideRequest(requestId, user.id);
  }
}
