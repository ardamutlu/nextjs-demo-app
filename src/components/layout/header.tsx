import * as React from "react";

import UserDropdownMenu from "../user-dropdown-menu";
import { Container } from "@/components/common/container";
import { MegaMenu } from "@/components/mega-menu";

export function Header() {
  return (
    <header className="flex shrink-0 items-center gap-2 py-2 shadow-sm border-b border-border">
      <Container>
        <div className="flex w-full items-center gap-1 lg:gap-2">
          <MegaMenu />
          <div className="ml-auto flex items-center gap-2">
            <UserDropdownMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
