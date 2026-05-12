"use client";

import { useSession, signOut } from "next-auth/react";
import { useChangeLanguage, useT } from "next-i18next/client";
import { useTheme } from "next-themes";
import { Globe, LogOutIcon, Moon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { I18N_LANGUAGES, Language } from "@/i18n/config";
import Image from "next/image";

export default function UserDropdownMenu() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useT();
  const changeLanguage = useChangeLanguage();
  const selectedLang = I18N_LANGUAGES.find(
    (language) => language.code == i18n.language,
  );
  const user = {
    name: session?.user?.name,
    email: session?.user?.email,
    image: session?.user?.image,
    shortName: session?.user?.name
      ? session.user.name.substring(0, 2).toLocaleUpperCase()
      : "",
  };

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code).then(() => window.location.reload());
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-full border border-border shrink-0 cursor-pointer">
          {user.image ? (
            <AvatarImage src={user.image} alt="user profile photo" />
          ) : null}
          <AvatarFallback>{user.shortName}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-full min-w-60"
        align="end"
        sideOffset={12}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {user.image ? (
                <AvatarImage src={user.image} alt="user profile photo" />
              ) : null}
              <AvatarFallback className="rounded-lg">
                {user.shortName}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 **:data-[slot=dropdown-menu-sub-trigger-indicator]:hidden hover:**:data-[slot=badge]:border-input data-[state=open]:**:data-[slot=badge]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              {t("language")}
              <Badge
                variant="outline"
                className="absolute inset-e-0 top-1/2 -translate-y-1/2"
              >
                {selectedLang?.name}
                <Image
                  src={selectedLang?.flag || ""}
                  height={14}
                  width={14}
                  className="rounded-full"
                  alt={selectedLang?.name || ""}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={selectedLang?.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value,
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <Image
                    src={item.flag}
                    width={16}
                    height={16}
                    className="rounded-full"
                    alt={item.name}
                  />
                  <span>{item.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon />
          <div className="flex items-center gap-2 justify-between grow">
            {t("darkMode")}
            <Switch
              size="sm"
              checked={theme === "dark"}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async (e) => {
            e.preventDefault();
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
