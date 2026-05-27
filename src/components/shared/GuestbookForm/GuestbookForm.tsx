'use client'

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Small,
  Textarea,
  toast,
} from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'
import { Form } from 'radix-ui'
import { useActionState, useEffect, useState } from 'react'

import { insertGuestbookEntry } from './actions'
import { FormState } from './types'

const INITIAL_FORM_STATE: FormState = {
  errors: null,
  success: false,
  entry: null,
}

export const GuestbookForm = () => {
  const t = useTranslations('components.guestbookForm')

  const [initialFormState, setInitialFormState] = useState(INITIAL_FORM_STATE)
  const [formState, action, isPending] = useActionState(insertGuestbookEntry, initialFormState)

  useEffect(() => {
    if (formState.success) {
      toast.success(t('success'))
      setInitialFormState(INITIAL_FORM_STATE)
    } else if (formState.errors) {
      toast.error(t('error'))
    }
  }, [t, formState, toast])

  const fieldClassName = 'flex flex-col gap-1'

  return (
    <Form.Root
      className='flex flex-col gap-4'
      action={action}
    >
      <Form.Field
        name='name'
        className={fieldClassName}
      >
        <div className='flex justify-between gap-4'>
          <Form.Label>{t('name.label')}</Form.Label>
          <Form.Message match='valueMissing'>
            <Small>{t('name.valueMissing')}</Small>
          </Form.Message>
        </div>
        <Form.Control asChild>
          <Input required />
        </Form.Control>
      </Form.Field>
      <Form.Field
        name='rating'
        className={fieldClassName}
      >
        <div className='flex justify-between gap-4'>
          <Form.Label>{t('rating.label')}</Form.Label>
        </div>
        <Form.Control asChild>
          <Select
            required
            defaultValue='5'
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>{t('rating.options.1')}</SelectItem>
              <SelectItem value='2'>{t('rating.options.2')}</SelectItem>
              <SelectItem value='3'>{t('rating.options.3')}</SelectItem>
              <SelectItem value='4'>{t('rating.options.4')}</SelectItem>
              <SelectItem value='5'>{t('rating.options.5')}</SelectItem>
            </SelectContent>
          </Select>
        </Form.Control>
      </Form.Field>
      <Form.Field
        name='message'
        className={fieldClassName}
      >
        <div className='flex justify-between gap-4'>
          <Form.Label>{t('message.label')}</Form.Label>
          <Form.Message match='valueMissing'>
            <Small>{t('message.valueMissing')}</Small>
          </Form.Message>
        </div>
        <Form.Control asChild>
          <Textarea required />
        </Form.Control>
      </Form.Field>
      <Form.Submit asChild>
        <Button
          disabled={isPending}
          className='self-end'
        >
          {t('sendButtonLabel')}
        </Button>
      </Form.Submit>
    </Form.Root>
  )
}
