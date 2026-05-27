'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@jan_hoeck/ui'
import { useLocale, useTranslations } from 'next-intl'

import { usePathname, useRouter } from '../../../i18n/navigation'
import { routing } from '../../../i18n/routing'

export const LanguageSelector = () => {
  const t = useTranslations('components.languageSelector')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const handleValueChange = (locale: string) => {
    router.replace({ pathname }, { locale })
    router.refresh()
  }

  return (
    <Select
      value={currentLocale}
      onValueChange={handleValueChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('placeholder')}>{t(`options.${currentLocale}`)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((locale) => (
          <SelectItem
            key={locale}
            value={locale}
          >
            {t(`options.${locale}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
