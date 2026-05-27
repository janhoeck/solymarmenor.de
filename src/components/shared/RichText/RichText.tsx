import { ContentBlock, ContentBlockProps } from '@/components/shared/ContentBlock/ContentBlock'
import { Section, SectionProps } from '@/components/shared/Section/Section'
import { HTMLElement, Node, NodeType, parse } from 'node-html-parser'
import React, { Fragment, ReactNode, useMemo } from 'react'

const renderNode = (node: Node): ReactNode => {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return node.textContent
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return null
  }

  const element = node as HTMLElement
  switch (element.tagName.toLowerCase()) {
    case 'section': {
      const headline = element.getAttribute('headline')
      if (!headline) {
        throw new Error('<section> is missing the required attribute headline')
      }

      const variant = (element.getAttribute('variant') as SectionProps['variant']) ?? 'default'
      return (
        <Section
          title={headline}
          variant={variant}
        >
          {Array.from(element.childNodes).map((n, i) => (
            <Fragment key={i}>{renderNode(n)}</Fragment>
          ))}
        </Section>
      )
    }

    case 'content': {
      const contentBlockItems: ContentBlockProps['items'] = []
      Array.from(element.children).forEach((child) => {
        switch (child.tagName.toLowerCase()) {
          case 'texts': {
            const textElements = Array.from(child.children).filter((child) => child.tagName.toLowerCase() === 'text')
            if (textElements.length === 0) {
              throw new Error('<texts> does not contain a <text>')
            }
            contentBlockItems.push(...textElements.map((element) => element.innerHTML))
            break
          }

          case 'bulletpoints': {
            const text = child.getAttribute('text') ?? undefined
            const bulletpointElements = Array.from(child.children).filter(
              (child) => child.tagName.toLowerCase() === 'bulletpoint'
            )
            if (bulletpointElements.length === 0) {
              throw new Error('<bulletpoints> does not contain a <bulletpoint>')
            }
            contentBlockItems.push({
              text: text,
              bulletpoints: bulletpointElements.map((element) => element.innerHTML),
            })
          }
        }
      })

      return <ContentBlock items={contentBlockItems} />
    }
  }
}

export type RichTextProps = {
  text: string
}

export const RichText = (props: RichTextProps) => {
  const { text } = props

  const parsedHtml = useMemo(() => {
    const document = parse(text)
    return document.firstChild
  }, [text])

  if (!parsedHtml) {
    return null
  }

  return (
    <>
      {Array.from(parsedHtml.childNodes).map((n, i) => (
        <React.Fragment key={i}>{renderNode(n)}</React.Fragment>
      ))}
    </>
  )
}
