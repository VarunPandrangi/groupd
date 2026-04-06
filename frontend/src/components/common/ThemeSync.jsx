import { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

export default function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
