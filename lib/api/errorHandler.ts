import { NextResponse } from 'next/server';

/**
 * Wraps an API route handler with standardised error handling.
 * Usage: export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler<T extends Request>(
  handler: (req: T, context?: any) => Promise<NextResponse>
) {
  return async (req: T, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (err: any) {
      const status = err.status ?? 500;
      const message = err.message ?? 'Internal Server Error';
      // Log full stack on server, return sanitised message to client
      console.error(`[API Error] ${req.method} ${new URL(req.url).pathname}:`, err);
      return NextResponse.json({ error: message }, { status });
    }
  };
}

/** Create a typed API error */
export class ApiError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertBody<T>(
  body: unknown,
  requiredKeys: (keyof T)[]
): asserts body is T {
  if (!body || typeof body !== 'object') {
    throw new ApiError('Request body is required', 400);
  }
  for (const key of requiredKeys) {
    if (!(key as string in (body as object))) {
      throw new ApiError(`Missing required field: ${String(key)}`, 400);
    }
  }
}
