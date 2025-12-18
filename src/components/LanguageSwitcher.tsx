import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Loader2 } from "lucide-react";

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
}

const LanguageSwitcher = ({ variant = 'compact', className = '' }: LanguageSwitcherProps) => {
  const { language, changeLanguage, isDetectingLocation } = useLanguage();

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  if (isDetectingLocation) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
          {variant === 'icon' ? (
            <Globe className="h-4 w-4" />
          ) : variant === 'full' ? (
            <>
              <span className="text-lg">{currentLang.flag}</span>
              <span>{currentLang.name}</span>
            </>
          ) : (
            <>
              <span className="text-lg">{currentLang.flag}</span>
              <span className="text-xs uppercase">{currentLang.code}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`gap-3 cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
