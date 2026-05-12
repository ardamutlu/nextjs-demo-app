import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { SentryProvider } from "./sentry-provider";

interface AuthProviderProps {
  children: React.ReactNode;
}

export async function AuthProvider({ children }: AuthProviderProps) {
  const session = await auth();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  console.debug("basePath:", basePath);

  return (
    <SessionProvider session={session} basePath={`${basePath}api/auth`}>
      <SentryProvider session={session}>{children}</SentryProvider>
    </SessionProvider>
  );
}
