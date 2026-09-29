import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EstimateFareDto {
  @ApiProperty({ example: 'BANANI', description: 'Origin pickup zone' })
  @IsString()
  @IsNotEmpty()
  pickupZone: string;

  @ApiProperty({ example: 'MOHAKHALI', description: 'Destination dropoff zone' })
  @IsString()
  @IsNotEmpty()
  dropoffZone: string;

  @ApiProperty({ example: true, required: false, description: 'Whether the trip is shared in a pool' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPooled?: boolean;
}
