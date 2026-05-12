import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) redirect("/signin");

  return session ? (
    <div className="wrapper flex grow flex-col">
      <Header />
      <MainContent>{children}</MainContent>
    </div>
  ) : null;
}
