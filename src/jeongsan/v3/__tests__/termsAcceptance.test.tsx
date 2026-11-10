import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountTermsGate, TermsConsentPage } from '../AccountTermsGate'
import { NamePage } from '../NamePage'
import { TermsPage } from '../TermsPage'
import { PrivacyPage } from '../PrivacyPage'
import { hasAcceptedTerms, rememberTermsAcceptance, termsAcceptanceKey, WEB_TERMS_VERSION } from '../termsAcceptance'

const values = new Map<string, string>()
beforeEach(() => {
  values.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('계정별 웹 약관 동의', () => {
  it('같은 계정의 현재 버전 동의만 재사용한다', () => {
    expect(hasAcceptedTerms(12)).toBe(false)
    rememberTermsAcceptance(12)
    expect(hasAcceptedTerms(12)).toBe(true)
    expect(hasAcceptedTerms(13)).toBe(false)
    expect(termsAcceptanceKey(12)).toContain(WEB_TERMS_VERSION)
    values.clear()
    values.set('jeongsan:terms:2026-10-21:user:12', 'accepted')
    expect(hasAcceptedTerms(12)).toBe(false)
  })

  it('실제 계정 ID가 없으면 저장하거나 통과시키지 않는다', () => {
    for (const id of [0, -1, NaN, Infinity, 1.5]) {
      rememberTermsAcceptance(id)
      expect(hasAcceptedTerms(id)).toBe(false)
    }
    expect(values.size).toBe(0)
  })

  it('저장소가 제한돼도 화면에서 동의할 수 있도록 예외를 밖으로 던지지 않는다', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } })
    expect(hasAcceptedTerms(12)).toBe(false)
    expect(() => rememberTermsAcceptance(12)).not.toThrow()
  })

  const renderGate = (id: number, needsName = false) => renderToStaticMarkup(createElement(AccountTermsGate, {
    me: { id, displayName: '총무12', spoonCount: 0, needsName },
    onLogout: async () => {}, children: createElement('div', {}, '회원 화면'),
  }))

  it('Apple 자동 이름이 있더라도 동의 전에는 회원 화면과 이름 입력을 띄우지 않는다', () => {
    const html = renderGate(12)
    expect(html).toContain('이용약관을 확인해주세요')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('회원 화면')
    expect(html).not.toContain('id="display-name"')
  })

  it('동의한 계정만 회원 화면을 표시하고 다른 계정은 다시 동의한다', () => {
    rememberTermsAcceptance(12)
    expect(renderGate(12)).toContain('회원 화면')
    expect(renderGate(12)).not.toContain('이용약관을 확인해주세요')
    expect(renderGate(13)).not.toContain('회원 화면')
  })

  it('이름을 입력하는 계정은 기존 이름 화면에서 약관을 한 번 확인한다', () => {
    const html = renderGate(12, true)
    expect(html).toContain('id="display-name"')
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    expect(html).not.toContain('이용약관을 확인해주세요')
    expect(html).not.toContain('회원 화면')
  })

  it('이미 동의한 계정의 이름 화면에는 약관 체크가 중복되지 않는다', () => {
    const html = renderToStaticMarkup(createElement(NamePage, {
      me: { id: 12, displayName: '', spoonCount: 0, needsName: true },
      termsAccepted: true, onConfirm: async () => null, onLogout: () => {},
    }))
    expect(html).toContain('id="display-name"')
    expect(html).not.toContain('type="checkbox"')
  })

  it('동의 화면에 이름 입력 없이 약관 링크와 다른 계정 로그인 출구를 제공한다', () => {
    const html = renderToStaticMarkup(createElement(TermsConsentPage, { onAccept: () => {}, onLogout: async () => {} }))
    expect(html).toContain('href="/jungsan/terms"')
    expect(html).toContain('다른 계정으로 로그인하기')
    expect(html).toContain('부적절한 메시지는 허용되지 않으며')
    expect(html).not.toContain('type="text"')
  })

  it('공개 약관과 개인정보 안내도 Apple 표시 이름과 최초 제공 이름을 설명한다', () => {
    const terms = renderToStaticMarkup(createElement(TermsPage, { onHome: () => {} }))
    const privacy = renderToStaticMarkup(createElement(PrivacyPage, { onHome: () => {} }))
    expect(terms).toContain('이름을 받지 못하면 기본 표시 이름')
    expect(terms).toContain('부적절한 콘텐츠와 다른 이용자를 괴롭히는 행위를 일절 허용하지 않습니다')
    expect(privacy).toContain('첫 동의 때 제공되는 이름')
  })
})
