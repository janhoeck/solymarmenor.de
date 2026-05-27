'use client'

import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@jan_hoeck/ui'
import Image from 'next/image'
import React, { useState } from 'react'
import { MdOutlineChevronLeft, MdOutlineChevronRight } from 'react-icons/md'

export type PropertyImageGridProps = {
  imageSources: PropertyConfiguration['imageSources']
}

export const PropertyImageGrid = (props: PropertyImageGridProps) => {
  const { imageSources } = props

  const [selectedIndex, setSelectedIndex] = useState(0)

  const handlePrevClick = () => {
    setSelectedIndex((prev) => {
      if (prev === 0) {
        return imageSources.length - 1
      }
      return prev - 1
    })
  }

  const handleNextClick = () => {
    setSelectedIndex((prev) => {
      if (prev === imageSources.length - 1) {
        return 0
      }
      return prev + 1
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden cursor-pointer'>
          <div className='relative h-full'>
            <Image
              fill
              priority
              src={imageSources[0]!}
              alt='Hauptbild'
              className='object-cover hover:brightness-75 transition-all'
              sizes='(max-width: 768px) 100vw, 50vw'
            />
          </div>

          <div className='grid grid-cols-2 gap-2 h-full'>
            {Array.from({ length: 4 }).map((_, index) => {
              const src = imageSources[index + 1]!
              return (
                <div
                  key={src}
                  className='relative'
                >
                  <Image
                    fill
                    src={src}
                    alt={`Immobilienbild ${index + 1}`}
                    className='object-cover hover:brightness-75 transition-all'
                    sizes='(max-width: 768px) 50vw, 25vw'
                  />
                </div>
              )
            })}
          </div>
        </div>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className='h-full max-w-svw w-svw sm:max-w-svw rounded-none flex flex-col'>
          <DialogHeader>
            <DialogTitle>Immobilienbild</DialogTitle>
            <DialogDescription>
              {selectedIndex + 1} / {imageSources.length}
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-between items-center flex-1 gap-4 px-4 min-h-0'>
            <Button
              size='icon'
              aria-label='Vorheriges Bild'
              onClick={handlePrevClick}
              className='hidden sm:flex shrink-0'
            >
              <MdOutlineChevronLeft size={24} />
            </Button>
            <div className='flex-1 h-full flex items-center justify-center min-h-0 overflow-hidden'>
              <img
                src={imageSources[selectedIndex]!}
                alt={`Immobilienbild`}
                className='max-w-full max-h-full w-auto h-auto rounded-xl object-contain'
              />
            </div>
            <Button
              size='icon'
              aria-label='Nächstes Bild'
              onClick={handleNextClick}
              className='hidden sm:flex shrink-0'
            >
              <MdOutlineChevronRight size={24} />
            </Button>
          </div>
          <div className='flex sm:hidden gap-4 pb-4 justify-center'>
            <Button
              size='icon'
              aria-label='Vorheriges Bild'
              onClick={handlePrevClick}
            >
              <MdOutlineChevronLeft size={24} />
            </Button>
            <Button
              size='icon'
              aria-label='Nächstes Bild'
              onClick={handleNextClick}
            >
              <MdOutlineChevronRight size={24} />
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
