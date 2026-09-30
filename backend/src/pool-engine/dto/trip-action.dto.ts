import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class TripActionDto {
  @ApiProperty({
    example: 'START',
    enum: ['ARRIVE', 'START', 'COMPLETE'],
    description: 'Driver action on active pool',
  })
  @IsString()
  @IsIn(['ARRIVE', 'START', 'COMPLETE'])
  @IsNotEmpty()
  action: 'ARRIVE' | 'START' | 'COMPLETE';
}
