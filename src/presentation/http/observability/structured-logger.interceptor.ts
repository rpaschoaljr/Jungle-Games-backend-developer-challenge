import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class StructuredLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = (req?.headers?.["x-correlation-id"] as string) || uuidv4();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const logPayload = {
            level: "info",
            correlationId,
            method: req?.method,
            path: req?.url,
            durationMs,
            providerId: req?.body?.providerId,
            walletId: req?.body?.walletId,
            timestamp: new Date().toISOString(),
          };
          console.log(JSON.stringify(logPayload));
        },
        error: (err) => {
          const durationMs = Date.now() - startTime;
          const logPayload = {
            level: "error",
            correlationId,
            method: req?.method,
            path: req?.url,
            durationMs,
            error: err.message,
            timestamp: new Date().toISOString(),
          };
          console.error(JSON.stringify(logPayload));
        },
      })
    );
  }
}
