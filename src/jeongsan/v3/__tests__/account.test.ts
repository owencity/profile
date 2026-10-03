/**
 * A1 계좌 등록 — 한 번 등록하면 재사용(SCREENS.md §5 A1). 결제자의 계좌가 생기면 보낼 사람이 [보냈어요]를
 * 누를 수 있게 되므로, 그 사람들에게 알린다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { entryRoute, rowBadge } from '../home'
import { participantOfUser } from '../model'
import { nextAction } from '../nextAction'
import { cleanAccountNo, copyableAccountNo, validatePayout } from '../payout'
import { useV3 } from '../store'

const SETTLING = 102 // 재훈(3, 참여자 23)은 2차 결제자인데 계좌가 없다. 동규(22)가 재훈에게 24,000원
const s = () => useV3.getState()
const room = (id = SETTLING) => s().rooms[id]
const KB = { bank: '국민', accountNo: '123-45-678901', holder: '박재훈' }

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
  s().actAs(3)
})

describe('입력 검증', () => {
  it('정상 입력은 막지 않는다', () => {
    expect(validatePayout(KB)).toEqual([])
  })

  it('은행·계좌번호·예금주가 비면 막는다', () => {
    expect(validatePayout({ bank: '', accountNo: '', holder: ' ' })).toEqual([
      '은행을 골라주세요', '계좌번호를 확인해주세요 (숫자 8~16자리)', '예금주를 넣어주세요',
    ])
  })

  it('계좌번호는 하이픈을 빼고 8~16자리여야 한다', () => {
    expect(validatePayout({ ...KB, accountNo: '1234-567' })).toContain('계좌번호를 확인해주세요 (숫자 8~16자리)')
    expect(validatePayout({ ...KB, accountNo: '1234-5678' })).toEqual([])
  })

  it('[계좌 복사]는 숫자만 복사한다 — 이체 화면에 하이픈·은행 이름이 섞이면 잘린다', () => {
    expect(copyableAccountNo('1000-1234-5678')).toBe('100012345678')
    expect(copyableAccountNo('3333-01-2345678')).toBe('3333012345678')
  })

  it('계좌번호 칸은 숫자와 하이픈만 받는다 — 은행 앱에서 복사한 그대로 붙여도 된다', () => {
    expect(cleanAccountNo('국민 123-45 678901 ')).toBe('123-45678901')
  })
})

describe('목록에서 계좌 등록이 가장 먼저', () => {
  it('계좌 없는 결제자의 줄엔 [계좌 등록] 뱃지가 다른 뱃지보다 먼저 붙는다', () => {
    // 재훈은 102에서 보낼 돈(정산금액 확인 대상)도 있지만 계좌 등록이 먼저
    expect(rowBadge(room(), 3, false)).toBe('계좌 등록')
  })

  it('그 줄을 누르면 계좌 등록 화면으로 바로 간다', () => {
    expect(entryRoute(room(), 3, false)).toBe('/jungsan/r/102/account')
  })

  it('등록하고 나면 원래 순서로 돌아간다', () => {
    s().registerPayout(KB)
    expect(rowBadge(room(), 3, false)).toBe('정산금액 확인')
    expect(entryRoute(room(), 3, false)).toBe('/jungsan/r/102/pay')
  })
})

describe('등록', () => {
  it('등록하면 결제자의 첫 할 일(계좌 등록)이 사라진다', () => {
    expect(nextAction(room(), 3).action?.kind).toBe('REGISTER_ACCOUNT')
    s().registerPayout(KB)
    expect(nextAction(room(), 3).action?.kind).not.toBe('REGISTER_ACCOUNT')
  })

  it('내가 들어간 진행 중인 술자리 모두에 같은 계좌가 들어간다', () => {
    s().registerPayout(KB)
    expect(participantOfUser(room(), 3)?.payout).toEqual(KB)
    expect(participantOfUser(s().rooms[101], 3)?.payout).toEqual(KB)
    expect(s().me.payout).toEqual(KB)
  })

  it('완료된 술자리의 기록은 바꾸지 않는다', () => {
    const before = participantOfUser(s().rooms[103], 3)?.payout
    s().registerPayout({ ...KB, accountNo: '999-99-999999' })
    expect(participantOfUser(s().rooms[103], 3)?.payout).toEqual(before)
  })

  it('보는 사람을 바꿨다 돌아와도 등록한 계좌가 남는다', () => {
    s().registerPayout(KB)
    s().actAs(1)
    s().actAs(3)
    expect(s().me.payout).toEqual(KB)
  })

  it('처음 등록하면 그 사람에게 보낼 돈이 있는 사람에게 알림이 가고, 누르면 보낼 돈으로 간다', () => {
    s().registerPayout(KB)
    const toDongkyu = s().notifications.find((n) => n.userId === 1 && n.roomId === SETTLING)!
    expect(toDongkyu.title).toBe('재훈님이 계좌를 등록했어요. 이제 보낼 수 있어요')
    expect(toDongkyu.link).toBe('/jungsan/r/102/pay')
  })

  it('타임라인에 등록 소식이 남는다', () => {
    s().registerPayout(KB)
    expect(room().timeline.at(-1)!.body).toBe('재훈님이 받을 계좌를 등록했어요')
  })
})
