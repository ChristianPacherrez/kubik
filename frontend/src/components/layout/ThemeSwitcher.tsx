'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="animate-theme-switch"
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark
            ? <Moon className="w-[14px] h-[14px]" strokeWidth={2} />
            : <Sun  className="w-[14px] h-[14px]" strokeWidth={2} />
          }
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </TooltipContent>
    </Tooltip>
  )
}
