import { Separator } from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'

import { Link } from '../../i18n/navigation'
import { LanguageSelector } from './LanguageSelector/LanguageSelector'

export const LayoutFooter = () => {
  const t = useTranslations('components.footer')
  return (
    <footer className='p-4'>
      <div className='flex flex-col items-end gap-4 px-4 sm:flex-row sm:items-center sm:justify-between'>
        <LanguageSelector />
        <div className='flex gap-4 text-sm text-muted-foreground'>
          <Link
            href='/imprint'
            className='hover:text-primary transition-colors'
          >
            {t('imprint')}
          </Link>
          <Link
            href='/privacy'
            className='hover:text-primary transition-colors'
          >
            {t('privacy')}
          </Link>
          <Link
            href='/contact'
            className='hover:text-primary transition-colors'
          >
            {t('contact')}
          </Link>
        </div>
      </div>
      <Separator className='my-4' />
      <div className='w-full text-center text-sm text-muted-foreground'>{t('allRightsReserved')}</div>
    </footer>
  )
}
