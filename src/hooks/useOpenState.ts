'use client'

import { useState } from 'react'

export const useOpenState = (defaultValue: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultValue)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((isOpen) => !isOpen)

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
