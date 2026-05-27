import { PropsWithChildren } from 'react'

export const MobileOnly = (props: PropsWithChildren) => {
  return <div className='contents lg:hidden'>{props.children}</div>
}
