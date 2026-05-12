"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMenu } from "@/hooks/use-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MENU_MEGA } from "@/config/menu.config";

export function MegaMenu() {
  const pathname = usePathname();
  const { isActive, hasActiveChild } = useMenu(pathname);

  const linkClass = `
    text-sm text-secondary-foreground font-medium 
    hover:text-primary hover:bg-transparent 
    focus:text-primary focus:bg-transparent 
    data-[active=true]:text-primary data-[active=true]:bg-transparent 
    data-[state=open]:text-primary data-[state=open]:bg-transparent
  `;

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {MENU_MEGA.map((item, index) => (
          <NavigationMenuItem key={index}>
            <NavigationMenuLink asChild>
              <Link
                href={item.path || "/"}
                className={cn(linkClass)}
                data-active={isActive(item.path) || undefined}
              >
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
