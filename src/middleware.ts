import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware simples - inicialização do DB é feita diretamente nos imports
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
