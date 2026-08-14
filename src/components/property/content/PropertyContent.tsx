import { List, P } from '@/components/ui'
import { resolveText } from '@/data/localized-text'
import type { PropertyContentBlock } from '@/data/property-schema'
import { useLocale } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type PropertyContentProps = {
  blocks: PropertyContentBlock[]
}

/**
 * Renders the editorial blocks of a property. Distinct from the shared
 * ContentBlock component, which renders plain strings for the legal pages.
 *
 * Content is authored in this repository, so inline markup (<strong>, <em>,
 * <br>) in the texts is rendered on purpose. That premise is not a convention:
 * `localizedTextSchema` rejects every other tag, and every LocalizedText the app
 * sees has passed it, so no other markup can reach this renderer.
 */
export const PropertyContent = (props: PropertyContentProps) => {
  const { blocks } = props
  const locale = useLocale()

  return (
    <div className='flex flex-col gap-4 prose max-w-none'>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <P
                key={index}
                dangerouslySetInnerHTML={{ __html: resolveText(block.text, locale) }}
              />
            )

          case 'list':
            return (
              <div key={index}>
                {block.intro && (
                  <P dangerouslySetInnerHTML={{ __html: resolveText(block.intro, locale) }} />
                )}
                <List>
                  {block.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      dangerouslySetInnerHTML={{ __html: resolveText(item, locale) }}
                    />
                  ))}
                </List>
              </div>
            )

          case 'note':
            return (
              <div
                key={index}
                className={twMerge([
                  'rounded-md border-l-4 px-4 py-3',
                  block.variant === 'warning'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-primary bg-primary/5',
                ])}
              >
                <P
                  className='!mt-0 !mb-0'
                  dangerouslySetInnerHTML={{ __html: resolveText(block.text, locale) }}
                />
              </div>
            )

          default:
            // Exhaustiveness guard: a new `contentBlockSchema` variant that isn't handled
            // above fails `pnpm check-types` here instead of silently rendering nothing.
            return block satisfies never
        }
      })}
    </div>
  )
}
