export type SupportedLanguage = "cpp" | "java";

export interface LanguageOption {
  id: SupportedLanguage;
  label: string;
  extension: string;
  monacoLang: string;
  commentPrefix: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: "cpp", label: "C++", extension: ".cpp", monacoLang: "cpp", commentPrefix: "//" },
  { id: "java", label: "Java", extension: ".java", monacoLang: "java", commentPrefix: "//" },
];
