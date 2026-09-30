import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DemoLoginDto } from './dto/demo-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user/current-user.decorator';
import type { AuthUserPayload } from './decorators/current-user/current-user.decorator';


@ApiTags('Authentication & Actors')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('actors')
  @ApiOperation({ summary: 'Get story cast (Jashim, Nusrat, Rafiq, Shirin) for 1-click switcher' })
  @ApiResponse({ status: 200, description: 'List of seeded demo actors' })
  getStoryActors() {
    return this.authService.getStoryActors();
  }

  @Post('demo-login')
  @ApiOperation({ summary: '1-Click Login as Jashim, Nusrat, Rafiq, or Shirin (issues JWT)' })
  @ApiResponse({ status: 200, description: 'JWT token and user profile returned' })
  demoLogin(@Body() dto: DemoLoginDto) {
    return this.authService.demoLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get currently authenticated actor profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getProfile(@CurrentUser() user: AuthUserPayload) {
    return this.authService.getMe(user.id);
  }
}
