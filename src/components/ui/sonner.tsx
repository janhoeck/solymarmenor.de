'use client'

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: <CircleCheckIcon className='size-4' />,
        info: <InfoIcon className='size-4' />,
        warning: <TriangleAlertIcon className='size-4' />,
        error: <OctagonXIcon className='size-4' />,
        loading: <Loader2Icon className='size-4 animate-spin' />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          '--success-bg': 'var(--success)',
          '--success-border': 'var(--success)',
          '--success-text': 'var(--success-foreground)',
          '--warning-bg': 'var(--warning)',
          '--warning-border': 'var(--warning)',
          '--warning-text': 'var(--warning)',
          '--error-bg': 'var(--destructive)',
          '--error-border': 'var(--destructive)',
          '--error-text': 'var(--destructive-foreground)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

/**
 *   --success-bg: hsl(143, 85%, 96%);
 *   --success-border: hsl(145, 92%, 87%);
 *   --success-text: hsl(140, 100%, 27%);
 */

export { Toaster }
export { toast } from 'sonner'
