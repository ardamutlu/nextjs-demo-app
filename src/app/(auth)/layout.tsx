import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (session) redirect("/");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">{children}</div>
    </div>
  );
}
