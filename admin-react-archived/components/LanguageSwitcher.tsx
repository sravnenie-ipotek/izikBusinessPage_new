'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import styles from './LanguageSwitcher.module.css';

// Option 1: Minimal Text Switcher (Default - Most Professional)
export const MinimalTextSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.minimalText}>
      <button
        className={cn(language === 'en' && styles.active)}
        onClick={() => setLanguage('en')}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className={styles.separator}>/</span>
      <button
        className={cn(language === 'he' && styles.active)}
        onClick={() => setLanguage('he')}
        aria-label="Switch to Hebrew"
      >
        עב
      </button>
    </div>
  );
};

// Option 2: Button Style Switcher
export const ButtonStyleSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.buttonStyle}>
      <button
        className={cn(language === 'en' && styles.active)}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        className={cn(language === 'he' && styles.active)}
        onClick={() => setLanguage('he')}
      >
        עברית
      </button>
    </div>
  );
};

// Option 3: Flag Icons Switcher
export const FlagIconsSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.flagIcons}>
      <button
        className={cn(styles.flagButton, language === 'en' && styles.active)}
        onClick={() => setLanguage('en')}
        aria-label="English"
      >
        <span className={styles.flagUs}>🇺🇸</span>
      </button>
      <button
        className={cn(styles.flagButton, language === 'he' && styles.active)}
        onClick={() => setLanguage('he')}
        aria-label="Hebrew"
      >
        <span className={styles.flagIl}>🇮🇱</span>
      </button>
    </div>
  );
};

// Option 4: Dropdown Switcher
export const DropdownSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.dropdown}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'he')}
        className={styles.select}
      >
        <option value="en">English</option>
        <option value="he">עברית</option>
      </select>
      <span className={styles.arrow}>▼</span>
    </div>
  );
};

// Option 5: Toggle Switch
export const ToggleSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.toggle}>
      <span className={styles.label}>EN</span>
      <button
        className={cn(styles.switch, language === 'he' && styles.active)}
        onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
        aria-label="Toggle language"
      >
        <span className={styles.slider} />
      </button>
      <span className={styles.label}>עב</span>
    </div>
  );
};

// Option 6: Animated Underline
export const AnimatedUnderlineSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.animatedUnderline}>
      <button
        className={cn(language === 'en' && styles.active)}
        onClick={() => setLanguage('en')}
      >
        ENGLISH
      </button>
      <button
        className={cn(language === 'he' && styles.active)}
        onClick={() => setLanguage('he')}
      >
        עברית
      </button>
    </div>
  );
};

// Default export - using Option 1 (Minimal Text) as it's most professional
const LanguageSwitcher = MinimalTextSwitcher;

export default LanguageSwitcher;