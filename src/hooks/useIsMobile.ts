'use client'

import { useEffect, useState } from 'react'

/**
 * useIsMobile
 * Reliable hook for detecting mobile devices.
 * Combines User-Agent analysis, touch capability, and viewport width.
 *
 * @param breakpoint - Optional viewport width in pixels (default: 768px)
 * @returns boolean - true if mobile device is detected
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  // SSR-safe initial value
  const getInitialValue = (): boolean => {
    if (typeof window === 'undefined') return false

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera
    return /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|kindle|mobile|palm|phone|opera mini|webos|windows phone/i.test(
      ua
    )
  }

  const [isMobile, setIsMobile] = useState(getInitialValue)

  useEffect(() => {
    const checkMobile = (): boolean => {
      // User-Agent check
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera
      const uaMobile =
        /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|kindle|mobile|palm|phone|opera mini|webos|windows phone/i.test(
          ua
        )

      // Touch capability
      const touchCapable =
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0

      // Viewport width as additional indicator
      const smallViewport = window.innerWidth < breakpoint

      // Combined logic: User-Agent OR (Touch AND small viewport)
      return uaMobile || (touchCapable && smallViewport)
    }

    const handleResize = () => {
      setIsMobile(checkMobile())
    }

    // Initial check
    handleResize()

    // Resize listener for responsive adjustments
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return isMobile
}
