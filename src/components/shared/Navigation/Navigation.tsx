import { DesktopOnly, MobileOnly } from '@jan_hoeck/ui'

import { DesktopNavigationContent } from './DesktopNavigationContent'
import { MobileNavigationContent } from './MobileNavigationContent'
import { NavigationConfiguration } from './types'

export type NavigationProps = {
  configuration: NavigationConfiguration
}

export const Navigation = (props: NavigationProps) => {
  const { configuration } = props

  return (
    <header className='sticky top-0 z-20 bg-card shadow-md backdrop-blur-sm'>
      <div className='container mx-auto px-6'>
        <DesktopOnly>
          <DesktopNavigationContent configuration={configuration} />
        </DesktopOnly>
        <MobileOnly>
          <MobileNavigationContent configuration={configuration} />
        </MobileOnly>
      </div>
    </header>
  )
}
