import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateVehicleStatusDto {
  @ApiProperty({
    example: true,
    description: 'Set true to go online and accept pools; false to go offline',
  })
  @IsBoolean()
  @IsNotEmpty()
  isOnline: boolean;
}
