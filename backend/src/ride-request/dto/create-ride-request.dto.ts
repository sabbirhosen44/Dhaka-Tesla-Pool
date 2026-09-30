import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRideRequestDto {
  @ApiProperty({ example: 'BANANI', description: 'Pickup zone in Dhaka' })
  @IsString()
  @IsNotEmpty()
  pickupZone: string;

  @ApiProperty({ example: 'MOHAKHALI', description: 'Dropoff zone in Dhaka' })
  @IsString()
  @IsNotEmpty()
  dropoffZone: string;

  @ApiProperty({ example: 1, default: 1, description: 'Number of seats requested (1 to 3)', required: false })
  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  seatsRequested?: number;
}
