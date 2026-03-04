import { useState, useEffect } from 'react'

export type LayoutMode = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX = 640
const TABLET_MAX = 1024

function getLayoutMode(): LayoutMode {
  const w = window.innerWidth
  if (w < MOBILE_MAX) return 'mobile'
  if (w < TABLET_MAX) return 'tablet'
  return 'desktop'
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(getLayoutMode)

  useEffect(() => {
    const handler = () => setMode(getLayoutMode())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return mode
}

/** Responsive value helper — pick value based on current layout mode */
export function useResponsive() {
  const mode = useLayoutMode()
  const isMobile = mode === 'mobile'
  const isTablet = mode === 'tablet'
  const isDesktop = mode === 'desktop'

  /** Pick a value based on breakpoint: rv(mobileVal, tabletVal, desktopVal) */
  function rv<T>(mobile: T, tablet: T, desktop: T): T {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop
  }

  return { mode, isMobile, isTablet, isDesktop, rv }
}
