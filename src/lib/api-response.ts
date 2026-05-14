import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export function jsonError(status: number, message: string, details?: unknown) {
  const body: ApiErrorBody = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

export function jsonFromZodError(e: ZodError) {
  return jsonError(400, "Ошибка валидации", e.flatten());
}
