import { List, P } from '@jan_hoeck/ui'

import { ContentBlock as ContentBlockType } from '../../../types/ContentBlock'

export type ContentBlockProps = {
  items: ContentBlockType
}

export const ContentBlock = (props: ContentBlockProps) => {
  const { items } = props
  return (
    <div className='flex flex-col gap-4 prose max-w-none'>
      {items.map((item, index) => {
        if (typeof item === 'string') {
          return (
            <P
              key={index}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          )
        }

        const { bulletpoints, text } = item
        return (
          <div key={index}>
            {text && (
              <P
                key={index}
                dangerouslySetInnerHTML={{ __html: text }}
              />
            )}
            <List>
              {bulletpoints.map((bulletpoint, index) => {
                return (
                  <li
                    key={index}
                    dangerouslySetInnerHTML={{ __html: bulletpoint }}
                  />
                )
              })}
            </List>
          </div>
        )
      })}
    </div>
  )
}
