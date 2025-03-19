import * as React from "react"
import { BREAKPOINTS } from "@/lib/constants"

/**
 * Responsive hooks for consistent screen size detection
 */

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsLargeHeight() {
  const [isLargeHeight, setIsLargeHeight] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-height: ${BREAKPOINTS.HEIGHT_LARGE}px)`)
    const onChange = () => {
      setIsLargeHeight(window.innerHeight >= BREAKPOINTS.HEIGHT_LARGE)
    }
    mql.addEventListener("change", onChange)
    setIsLargeHeight(window.innerHeight >= BREAKPOINTS.HEIGHT_LARGE)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isLargeHeight
}

export function useIsExtraLargeHeight() {
  const [isExtraLargeHeight, setIsExtraLargeHeight] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-height: ${BREAKPOINTS.HEIGHT_XLARGE}px)`)
    const onChange = () => {
      setIsExtraLargeHeight(window.innerHeight >= BREAKPOINTS.HEIGHT_XLARGE)
    }
    mql.addEventListener("change", onChange)
    setIsExtraLargeHeight(window.innerHeight >= BREAKPOINTS.HEIGHT_XLARGE)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isExtraLargeHeight
}
