import { Controller, type MessageEvent, Req, Sse, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Public } from '../../common/decorators/public.decorator';
import { SseTokenGuard } from '../../common/guards/sse-token.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { RedisService } from '../../redis/redis.service';
import { notificationChannel } from './notifications.service';

/**
 * Server-Sent Events stream of realtime notifications, backed by Redis pub/sub
 * (horizontally scalable). The access token is passed via `?token=` and verified
 * by {@link SseTokenGuard} before the stream opens. A heartbeat keeps proxies from
 * closing idle connections.
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsStreamController {
  constructor(private readonly redis: RedisService) {}

  @Public()
  @UseGuards(SseTokenGuard)
  @Sse('stream')
  @ApiOperation({ summary: 'Realtime notification stream (SSE). Pass ?token=<accessToken>.' })
  stream(@Req() req: AuthenticatedRequest): Observable<MessageEvent> {
    const channel = notificationChannel(req.user.id);

    return new Observable<MessageEvent>((subscriber) => {
      const sub = this.redis.raw.duplicate();
      const onMessage = (chan: string, message: string) => {
        if (chan === channel) subscriber.next({ data: message });
      };
      sub.subscribe(channel).catch(() => subscriber.error(new Error('subscribe failed')));
      sub.on('message', onMessage);

      const heartbeat = setInterval(
        () => subscriber.next({ data: JSON.stringify({ type: 'ping' }) }),
        25_000,
      );

      return () => {
        clearInterval(heartbeat);
        sub.removeListener('message', onMessage);
        void sub.unsubscribe(channel).catch(() => undefined);
        void sub.quit().catch(() => undefined);
      };
    });
  }
}
