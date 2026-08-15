export type SupportedLanguage = "python" | "cpp" | "java" | "javascript" | "typescript";

export interface LanguageOption {
  id: SupportedLanguage;
  label: string;
  extension: string;
  monacoLang: string;
  commentPrefix: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: "python", label: "Python 3", extension: ".py", monacoLang: "python", commentPrefix: "#" },
  { id: "cpp", label: "C++", extension: ".cpp", monacoLang: "cpp", commentPrefix: "//" },
  { id: "java", label: "Java", extension: ".java", monacoLang: "java", commentPrefix: "//" },
  { id: "javascript", label: "JavaScript", extension: ".js", monacoLang: "javascript", commentPrefix: "//" },
  { id: "typescript", label: "TypeScript", extension: ".ts", monacoLang: "typescript", commentPrefix: "//" },
];
