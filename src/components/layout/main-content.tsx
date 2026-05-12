import { PropsWithChildren } from "react";
import { Container } from "@/components/common/container";

export default function MainContent({ children }: PropsWithChildren) {
  return (
    <main className="grow pt-5" role="main">
      <Container>{children}</Container>
    </main>
  );
}
