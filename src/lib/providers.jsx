"use client"

import { useState, useEffect, useMemo } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider as NextjsThemeProvider, useTheme as useNextTheme } from "next-themes"
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { getTheme } from "@/lib/theme"

// Wrapper to bridge next-themes and MUI
function MuiThemeWrapper({ children }) {
  const { resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const theme = useMemo(() => {
    // Default to light if not mounted or undefined, otherwise use resolvedTheme
    const currentTheme = mounted && resolvedTheme ? resolvedTheme : 'light'
    return getTheme(currentTheme)
  }, [resolvedTheme, mounted])

  // Prevent hydration mismatch by rendering nothing until mounted (optional, or render with default)
  // Rendering with default 'light' matches the server output usually
  
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient(
        {
          defaultOptions: {
            queries: {
              staleTime: 5 * 60 * 1000,
              gcTime: 5 * 60 * 1000,
            },
          },
        }
      )
  )

  return (
      <NextjsThemeProvider attribute='class' defaultTheme="system" enableSystem>
        <MuiThemeWrapper>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
          </QueryClientProvider>
        </MuiThemeWrapper>
      </NextjsThemeProvider>
  )
}
