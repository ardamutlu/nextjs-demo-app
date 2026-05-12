import { createMiddleware } from "next-i18next/proxy";
import { NextRequest } from "next/server";
import { i18nConfig } from "@/i18n/i18n.config";

export default async function proxy(request: NextRequest) {
  const cookieName = i18nConfig["cookieName"] as string;
  const headerName = i18nConfig["headerName"] as string;
  const fallbackLng = request.cookies.get(cookieName)?.value || "en";
  const handleI18nRouting = createMiddleware({ ...i18nConfig, fallbackLng });
  const response = handleI18nRouting(request);

  response.headers.set(headerName, fallbackLng);
  response.cookies.set(cookieName, fallbackLng);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)",
  ],
};
