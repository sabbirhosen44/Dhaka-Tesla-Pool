import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TeslaSyncEvent {
  type:
    | 'RIDE_REQUESTED'
    | 'POOL_MATCHED'
    | 'CAPACITY_FULL'
    | 'DRIVER_ARRIVED'
    | 'TRIP_STARTED'
    | 'TRIP_COMPLETED'
    | 'RIDE_CANCELLED';
  payload: any;
  timestamp: string;
}

@Injectable()
export class SyncService {
  private readonly eventBus$ = new Subject<TeslaSyncEvent>();

  /**
   * Broadcast real-time event to all connected Passenger & Driver SSE clients
   */
  emit(type: TeslaSyncEvent['type'], payload: any) {
    this.eventBus$.next({
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * SSE Stream observable
   */
  getEventStream(): Observable<MessageEvent> {
    return this.eventBus$.asObservable().pipe(
      map((event) => ({
        data: event,
      } as MessageEvent)),
    );
  }
}
