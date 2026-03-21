'use client';
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode palette
            primary: {
              main: '#2563eb', // blue-600
            },
            background: {
              default: '#f8fafc', // slate-50
              paper: '#ffffff',
            },
            text: {
              primary: '#1e293b', // slate-800
              secondary: '#64748b', // slate-500
            },
          }
        : {
            // Dark mode palette
            primary: {
              main: '#3b82f6', // blue-500
            },
            background: {
              default: '#0f172a', // slate-900
              paper: '#1e293b', // slate-800
            },
            text: {
              primary: '#f1f5f9', // slate-100 (more readable than slate-200)
              secondary: '#cbd5e1', // slate-300
            },
          }),
    },
    typography: {
      fontFamily: 'var(--font-poppins), "Poppins", sans-serif',
      h1: { fontWeight: 700, lineHeight: 1.2 },
      h2: { fontWeight: 700, lineHeight: 1.3 },
      h3: { fontWeight: 600, lineHeight: 1.3 },
      h4: { fontWeight: 600, lineHeight: 1.4 },
      h5: { fontWeight: 500, lineHeight: 1.5 },
      h6: { fontWeight: 500, lineHeight: 1.5 },
      body1: { lineHeight: 1.7 },
      body2: { lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove default gradient overlay in dark mode
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff',
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
