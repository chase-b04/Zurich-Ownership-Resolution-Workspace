import { NextResponse } from "next/server";
import { ApiErrorBody } from "@/lib/types";
import { ServiceNowApiError } from "@/lib/servicenow/client";

const CODE_BY_STATUS: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  500: "server_error",
  503: "unavailable",
};

export function errorResponse(status: number, message: string, details?: string) {
  const body: ApiErrorBody = {
    error: {
      code: CODE_BY_STATUS[status] ?? "error",
      message,
      details,
    },
  };
  return NextResponse.json(body, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof ServiceNowApiError) {
    return errorResponse(err.status, err.message);
  }
  console.error(err);
  return errorResponse(500, "Unexpected server error");
}
