import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SyncService } from './sync.service';

@ApiTags('Sync Engine (SSE)')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time Server-Sent Events (SSE) stream for passenger & driver view synchronization',
  })
  syncStream(): Observable<MessageEvent> {
    return this.syncService.getEventStream();
  }
}
