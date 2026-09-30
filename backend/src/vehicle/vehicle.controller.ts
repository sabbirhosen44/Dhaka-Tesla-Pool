import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { UpdateVehicleStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import type { AuthUserPayload } from '../auth/decorators/current-user/current-user.decorator';

@ApiTags('Vehicle & Manifest')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all registered vehicles (optionally filter by online status)' })
  @ApiQuery({ name: 'onlineOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of registered vehicles' })
  getAllVehicles(@Query('onlineOnly') onlineOnly?: string) {
    return this.vehicleService.getAllVehicles(onlineOnly === 'true');
  }

  @Get('bullet')
  @ApiOperation({ summary: 'Get details of the story EV "Bullet"' })
  @ApiResponse({ status: 200, description: 'Bullet vehicle record with driver details' })
  getBullet() {
    return this.vehicleService.getBulletVehicle();
  }

  @Get('driver/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get logged-in driver’s assigned vehicle' })
  @ApiResponse({ status: 200, description: 'Driver vehicle record' })
  getMyVehicle(@CurrentUser() user: AuthUserPayload) {
    return this.vehicleService.getVehicleByDriverId(user.id);
  }

  @Get(':id/manifest')
  @ApiOperation({
    summary: 'Live manifest for ANY vehicle: dynamic capacity, remaining seats, and passenger list',
  })
  @ApiResponse({ status: 200, description: 'Live vehicle manifest' })
  getManifest(@Param('id') vehicleId: string) {
    return this.vehicleService.getVehicleManifest(vehicleId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Driver toggles vehicle online/offline status (Driver-only)' })
  @ApiResponse({ status: 200, description: 'Updated vehicle online status' })
  updateStatus(
    @Param('id') vehicleId: string,
    @Body() dto: UpdateVehicleStatusDto,
  ) {
    return this.vehicleService.updateStatus(vehicleId, dto.isOnline);
  }
}
