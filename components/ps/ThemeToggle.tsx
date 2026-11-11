'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/** Light / dark switch. The choice is saved in this browser (key bw-theme) and applied before the page paints (see the script in the root layout). */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  const flip = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; setDark(next === 'dark');
    try { localStorage.setItem('bw-theme', next); } catch { /* storage unavailable */ }
  };
  return (
    <button type="button" className="ps-theme" onClick={flip} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark} title={dark ? 'Light mode' : 'Dark mode'}>
      <Sun size={19} className="t-sun" aria-hidden /><Moon size={19} className="t-moon" aria-hidden />
    </button>
  );
}
