import { PropertyListSection } from '@/components/home/PropertyListSection/PropertyListSection'
import React from 'react'

import { MainSection } from './MainSection/MainSection'
import { WelcomeSection } from './WelcomeSection/WelcomeSection'

export const HomeView = () => {
  return (
    <div className='flex flex-col'>
      <WelcomeSection />
      <MainSection />
      <PropertyListSection />
    </div>
  )
}
