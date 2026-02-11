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
              primary: '#e2e8f0', // slate-200
              secondary: '#94a3b8', // slate-400
            },
          }),
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
