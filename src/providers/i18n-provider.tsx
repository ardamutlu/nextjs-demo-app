"use client";

import { PropsWithChildren } from "react";
import { I18nProvider, I18nProviderProps } from "next-i18next/client";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { I18N_LANGUAGES } from "@/i18n/config";

function I18nNextProvider({
  children,
  ...props
}: PropsWithChildren<I18nProviderProps>) {
  const currentLanguage =
    I18N_LANGUAGES.find((lang) => lang.code === props.language) ||
    I18N_LANGUAGES[0];

  return (
    <I18nProvider {...props}>
      <RadixDirectionProvider dir={currentLanguage.direction}>
        {children}
      </RadixDirectionProvider>
    </I18nProvider>
  );
}

export { I18nNextProvider };
