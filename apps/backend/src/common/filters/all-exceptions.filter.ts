import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    // Erreurs issues de middlewares Express bruts (ex: csrf-csrf) construites via `http-errors` :
    // pas des HttpException Nest, mais elles portent un vrai statusCode/status HTTP à respecter.
    const rawStatus = !isHttpException && exception && typeof exception === 'object'
      ? (exception as { status?: unknown; statusCode?: unknown }).status ?? (exception as { statusCode?: unknown }).statusCode
      : undefined;
    const hasValidRawStatus = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600;

    const status = isHttpException
      ? exception.getStatus()
      : hasValidRawStatus
        ? (rawStatus as number)
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    let error: string;
    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const bodyObj = body as Record<string, unknown>;
        message = (bodyObj.message as string | string[]) || exception.message;
        error = (bodyObj.error as string) || exception.name;
      }
    } else if (hasValidRawStatus && exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      // Erreur non prévue (bug, échec DB, etc.) : jamais exposer le détail interne au client.
      message = 'Une erreur interne est survenue';
      error = 'Internal Server Error';
    }

    const responseBody: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.url} → ${status}: ${stack}`);
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json(responseBody);
  }
}
