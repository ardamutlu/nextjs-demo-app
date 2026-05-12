import { I18nConfig } from "next-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";

export const i18nConfig: I18nConfig = {
  supportedLngs: SUPPORTED_LANGUAGES,
  fallbackLng: "en",
  cookieName: "i18next",
  headerName: "x-i18next-current-language",
  localeInPath: false,
  defaultNS: "common",
  ns: ["common", "sign-in", "repositories"],
  resourceLoader: (lng, ns) => import(`../../public/locales/${lng}/${ns}.json`),
};
