import { corsHeaders } from './cors.ts';

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED_USER'
  | 'GROQ_RATE_LIMITED'
  | 'GROQ_UNAVAILABLE'
  | 'GROQ_AUTH'
  | 'MODEL_OUTPUT_INVALID'
  | 'INTERNAL';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
  RATE_LIMITED_USER: 429,
  GROQ_RATE_LIMITED: 503,
  GROQ_UNAVAILABLE: 503,
  GROQ_AUTH: 500,
  MODEL_OUTPUT_INVALID: 502,
  INTERNAL: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  extra: Record<string, unknown>;
  constructor(code: ErrorCode, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.extra = extra;
  }
}

export function jsonOk(body: Record<string, unknown>, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200,
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...(init.headers ?? {}) },
  });
}

export function jsonError(err: AppError | Error, extraHeaders: Record<string, string> = {}): Response {
  const code: ErrorCode = err instanceof AppError ? err.code : 'INTERNAL';
  const status = STATUS_BY_CODE[code];
  const body: Record<string, unknown> = {
    ok: false,
    code,
    message: err.message,
    ...(err instanceof AppError ? err.extra : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders },
  });
}
