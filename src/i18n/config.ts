export interface Language {
  code: string;
  name: string;
  shortName: string;
  direction: "ltr" | "rtl";
  flag: string;
}

export const I18N_LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    shortName: "EN",
    direction: "ltr",
    flag: "/media/flags/united-states.svg",
  },
  {
    code: "tr",
    name: "Türkçe",
    shortName: "TR",
    direction: "ltr",
    flag: "/media/flags/turkey.svg",
  },
];

export const SUPPORTED_LANGUAGES: string[] = I18N_LANGUAGES.map(
  (lang) => lang.code,
);
