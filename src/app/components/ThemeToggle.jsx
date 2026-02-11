'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to avoid layout shift
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
      aria-label="Toggle Theme"
      title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {resolvedTheme === 'dark' ? (
        <MdLightMode className="text-yellow-300 text-xl" />
      ) : (
        <MdDarkMode className="text-blue-100 hover:text-white text-xl" />
      )}
    </button>
  );
}
