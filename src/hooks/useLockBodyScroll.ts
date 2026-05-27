'use client'

import { useLayoutEffect } from 'react'

export const useLockBodyScroll = (enable: boolean = true) => {
  useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow

    if (!enable) {
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [enable])
}
