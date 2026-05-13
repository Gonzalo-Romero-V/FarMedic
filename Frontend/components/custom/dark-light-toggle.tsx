"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function DarkLightToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-hidden className="h-9 w-9" />
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggle = () => {
    const next = isDark ? "light" : "dark"
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> }
    }
    if (typeof doc.startViewTransition !== "function") {
      setTheme(next)
      return
    }
    doc.startViewTransition(() => setTheme(next))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      onClick={toggle}
      className="h-9 w-9"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
