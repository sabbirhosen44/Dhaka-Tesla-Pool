import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DemoLoginDto {
  @ApiProperty({
    example: '+8801711000002',
    description: 'Phone number of the cast member (e.g., Nusrat: +8801711000002, Jashim: +8801711000001)',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Nusrat',
    description: 'Name of the story actor: Jashim | Nusrat | Rafiq | Shirin',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
