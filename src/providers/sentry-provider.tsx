"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";

interface Props {
  children: React.ReactNode;
  session: Session | null;
}

export function SentryProvider({ children }: Props) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email || undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);

  return <>{children}</>;
}
