'use client'

import clsx from 'clsx'
import React, { Ref, forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export type ShakerProps<T = object> = {
  item?: T
  children: React.ReactElement
  className?: string
}

export type ShakerRef<T = object> = {
  item: T
  shake: () => void
}

function ShakerWithRef<T = object>(props: ShakerProps<T>, ref: Ref<ShakerRef<T>>) {
  const { children, className, item } = props

  const [shakeRunning, setShakeRunning] = useState<boolean>(false)
  const timeoutId = useRef<NodeJS.Timeout>(null)

  useImperativeHandle(
    ref,
    () =>
      ({
        item: item,
        shake: () => {
          if (timeoutId.current) {
            // clear the current running timeout if there is still a current running one
            clearTimeout(timeoutId.current)
          }

          setShakeRunning(true)
          timeoutId.current = setTimeout(() => {
            timeoutId.current = null
            setShakeRunning(false)
          }, 820) // 820, because the shake css keyframe animation is 820ms long
        },
      }) as ShakerRef<T>
  )

  return (
    <div
      className={twMerge(
        clsx({
          'animate-shake': shakeRunning,
        }),
        className
      )}
    >
      {children}
    </div>
  )
}

export const Shaker = forwardRef(ShakerWithRef) as <T = object>(
  p: ShakerProps<T> & { ref?: Ref<ShakerRef<T>> }
) => React.ReactElement
