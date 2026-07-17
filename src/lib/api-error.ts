import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN_ROLE"
  | "FORBIDDEN_OWNERSHIP"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE_VIOLATION"
  | "INTERNAL_ERROR";

const STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN_ROLE: 403,
  FORBIDDEN_OWNERSHIP: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>
) {
  const status = STATUS_MAP[code];
  return NextResponse.json(
    { error: { code, message, ...(extra ?? {}) } },
    { status }
  );
}

export function unauthorized() {
  return apiError("UNAUTHORIZED", "Sesi tidak ditemukan. Silakan login kembali.");
}

export function forbiddenRole() {
  return apiError("FORBIDDEN_ROLE", "Akses ditolak. Peran Anda tidak diizinkan.");
}

export function forbiddenOwnership() {
  return apiError(
    "FORBIDDEN_OWNERSHIP",
    "Akses ditolak. Anda bukan pemilik resource ini."
  );
}

export function notFound(message = "Resource tidak ditemukan.") {
  return apiError("NOT_FOUND", message);
}

export function validationError(message: string, issues?: unknown) {
  return apiError("VALIDATION_ERROR", message, { issues });
}

export function conflict(message: string) {
  return apiError("CONFLICT", message);
}

export function businessRuleViolation(
  message: string,
  extra?: Record<string, unknown>
) {
  return apiError("BUSINESS_RULE_VIOLATION", message, extra);
}

export function internalError(message = "Terjadi kesalahan internal.") {
  return apiError("INTERNAL_ERROR", message);
}