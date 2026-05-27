import { PropsWithChildren } from 'react'

export const DesktopOnly = (props: PropsWithChildren) => {
  return <div className='hidden lg:contents'>{props.children}</div>
}
