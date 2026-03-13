import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: string;
  detail?: string;
  retry_after?: number;
  [key: string]: unknown;
};

/**
 * Centralized API error response handler
 * Ensures consistent error responses across all endpoints
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public body: ApiErrorBody
  ) {
    super(body.error);
    this.name = "ApiError";
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.body, { 
      status: this.statusCode,
      headers: this.getHeaders() 
    });
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.statusCode === 429 && this.body.retry_after) {
      headers["Retry-After"] = String(this.body.retry_after);
    }

    return headers;
  }
}

/**
 * Create standardized error responses
 */
export const errorResponses = {
  unauthorized: (detail?: string) => 
    new ApiError(401, { error: "Unauthorized", detail }),
  
  badRequest: (error: string, detail?: string) => 
    new ApiError(400, { error, detail }),
  
  forbidden: (detail?: string) => 
    new ApiError(403, { error: "Forbidden", detail }),
  
  notFound: (detail?: string) => 
    new ApiError(404, { error: "Not Found", detail }),
  
  unprocessable: (error: string, detail?: string) => 
    new ApiError(422, { error, detail }),
  
  tooManyRequests: (retryAfter: number = 60) => 
    new ApiError(429, { 
      error: "Too many requests", 
      retry_after: retryAfter 
    }),
  
  internalError: (detail?: string) => 
    new ApiError(500, { error: "Internal Server Error", detail }),
  
  badGateway: (detail?: string) => 
    new ApiError(502, { error: "Upstream API error", detail }),
};

/**
 * Wrap async route handlers with consistent error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch((error) => {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    
    // Log unexpected errors
    console.error("[API] Unexpected error:", error);
    
    return errorResponses.internalError(
      process.env.NODE_ENV === "development" 
        ? error instanceof Error ? error.message : String(error)
        : undefined
    ).toResponse();
  });
}
