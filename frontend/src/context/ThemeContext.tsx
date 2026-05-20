'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'kubik-theme'
const DEFAULT_THEME: Theme = 'dark'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  // Leer preferencia guardada al montar (solo en cliente)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
        applyTheme(saved)
      } else {
        // Sin preferencia: dark por defecto
        applyTheme(DEFAULT_THEME)
      }
    } catch {
      applyTheme(DEFAULT_THEME)
    }
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    applyTheme(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch { /* storage no disponible */ }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch { /* storage no disponible */ }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

// ─── Helper: aplica clase .dark al <html> ─────────────────────────────────────

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
