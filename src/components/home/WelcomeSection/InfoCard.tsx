import { Card, CardDescription, CardHeader, CardTitle } from '@jan_hoeck/ui'
import React from 'react'

export type InfoCardProps = {
  title: string | number
  description: string
}

export const InfoCard = (props: InfoCardProps) => {
  const { title, description } = props
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-primary font-serif text-3xl font-bold md:text-4xl'>{title}</CardTitle>
        <CardDescription className='text-muted-foreground mt-1 text-sm md:text-base'>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
