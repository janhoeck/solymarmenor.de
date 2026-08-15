'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui'
import { resolveText } from '@/data/localized-text'
import type { Property } from '@/data/property-schema'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import { MdOutlineChevronLeft, MdOutlineChevronRight } from 'react-icons/md'

export type PropertyImageGridProps = {
  images: Property['images']
  fallbackAlt: string
}

/** How many images on each side of the current one to fetch ahead of time. */
const PRELOAD_RADIUS = 2

export const PropertyImageGrid = (props: PropertyImageGridProps) => {
  const { images, fallbackAlt } = props
  const locale = useLocale()

  const allImages = useMemo(() => [images.cover, ...images.gallery], [images])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // The lightbox mounts only the selected image, so until the click happened the
  // browser did not know the next one existed. Every step therefore paid a full
  // round trip plus a server-side re-encode. Rendering the neighbours off screen
  // with the same `sizes` yields the exact same /_next/image URL, so the click
  // afterwards is served from the browser cache. Wraps around, because the
  // arrows do too.
  const preloadImages = useMemo(() => {
    const indices = new Set<number>()
    for (let offset = -PRELOAD_RADIUS; offset <= PRELOAD_RADIUS; offset += 1) {
      if (offset !== 0) {
        indices.add((selectedIndex + offset + allImages.length) % allImages.length)
      }
    }
    // With fewer images than the radius the wrap-around lands on the current one
    // again, which would render it a second time for nothing.
    indices.delete(selectedIndex)
    return [...indices].map((index) => allImages[index]!)
  }, [selectedIndex, allImages])

  const altFor = (image: Property['images']['cover']) => (image.alt ? resolveText(image.alt, locale) : fallbackAlt)

  const showPrevious = () => {
    setSelectedIndex((prev) => {
      if (prev === 0) {
        return allImages.length - 1
      }
      return prev - 1
    })
  }

  const showNext = () => {
    setSelectedIndex((prev) => {
      if (prev === allImages.length - 1) {
        return 0
      }
      return prev + 1
    })
  }

  // Radix only binds Escape, and the focus trap parks the caret on a <button>,
  // which ignores the arrow keys natively. Listening on the content element
  // catches them wherever focus sits inside the lightbox.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPrevious()
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      showNext()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden cursor-pointer'>
          <div className='relative h-full'>
            <Image
              fill
              priority
              src={images.cover.src}
              alt={altFor(images.cover)}
              className='object-cover hover:brightness-75 transition-all'
              sizes='(max-width: 768px) 100vw, 50vw'
            />
          </div>

          <div className='grid grid-cols-2 gap-2 h-full'>
            {images.gallery.slice(0, 4).map((image) => (
              <div
                key={image.src}
                className='relative'
              >
                <Image
                  fill
                  src={image.src}
                  alt={altFor(image)}
                  className='object-cover hover:brightness-75 transition-all'
                  sizes='(max-width: 768px) 50vw, 25vw'
                />
              </div>
            ))}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        onKeyDown={handleKeyDown}
        className='h-full max-w-svw w-svw sm:max-w-svw rounded-none flex flex-col'
      >
        <DialogHeader>
          <DialogTitle>Immobilienbild</DialogTitle>
          <DialogDescription>
            {selectedIndex + 1} / {allImages.length}
          </DialogDescription>
        </DialogHeader>
        <div className='flex justify-between items-center flex-1 gap-4 px-4 min-h-0'>
          <Button
            size='icon'
            aria-label='Vorheriges Bild'
            onClick={showPrevious}
            className='hidden sm:flex shrink-0'
          >
            <MdOutlineChevronLeft size={24} />
          </Button>
          <div className='flex-1 h-full flex items-center justify-center min-h-0 overflow-hidden'>
            <Image
              src={allImages[selectedIndex]!.src}
              alt={altFor(allImages[selectedIndex]!)}
              width={allImages[selectedIndex]!.width}
              height={allImages[selectedIndex]!.height}
              className='max-w-full max-h-full w-auto h-auto rounded-xl object-contain'
              sizes='100vw'
              loading='eager'
              fetchPriority='high'
            />
          </div>
          <Button
            size='icon'
            aria-label='Nächstes Bild'
            onClick={showNext}
            className='hidden sm:flex shrink-0'
          >
            <MdOutlineChevronRight size={24} />
          </Button>
        </div>
        <div className='flex sm:hidden gap-4 pb-4 justify-center'>
          <Button
            size='icon'
            aria-label='Vorheriges Bild'
            onClick={showPrevious}
          >
            <MdOutlineChevronLeft size={24} />
          </Button>
          <Button
            size='icon'
            aria-label='Nächstes Bild'
            onClick={showNext}
          >
            <MdOutlineChevronRight size={24} />
          </Button>
        </div>

        {/* Zero-sized rather than `hidden`: a display:none image is still
            fetched, but only `loading='eager'` makes that a guarantee instead
            of a viewport heuristic. `fetchPriority='low'` keeps these behind
            the image the visitor is actually looking at. */}
        <div
          aria-hidden
          className='pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0'
        >
          {preloadImages.map((image) => (
            <Image
              key={image.src}
              src={image.src}
              alt=''
              width={image.width}
              height={image.height}
              sizes='100vw'
              loading='eager'
              fetchPriority='low'
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
