import { describe, expect, it } from 'vitest'

import { availableLocales, getLocale, setLocale } from '@/i18n'

describe('english-only locale', () => {
  it('resolves to English and ignores other locale requests', async () => {
    expect(getLocale()).toBe('en')
    expect(availableLocales.map((locale) => locale.code)).toEqual(['en'])

    await setLocale('zh')

    expect(getLocale()).toBe('en')
  })
})
