/**
 * L2 이름 확인 — 첫 로그인 때 한 번 실명을 성까지 받는다(총무가 입금자명과 맞춰 보기 위해).
 * 카카오 닉네임은 따로 두고 목록에서만 `이름(닉네임)`으로 붙인다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { initialOf, nameWithNick, participantOfUser } from '../model'
import { MAX_NAME, validateName } from '../name'
import { useV3 } from '../store'

const s = () => useV3.getState()

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('이름 규칙', () => {
  it('빈 이름과 공백만 있는 이름은 막는다', () => {
    expect(validateName('')).toEqual(['이름을 넣어주세요'])
    expect(validateName('   ')).toEqual(['이름을 넣어주세요'])
  })

  it('한 글자는 성이 빠진 것으로 보고 막는다', () => {
    expect(validateName('규')).toEqual(['성까지 적어주세요'])
    expect(validateName('김규')).toEqual([])
  })

  it(`${MAX_NAME}자까지 받는다 — 참여자 줄·알림 문구에서 깨지지 않는 길이`, () => {
    expect(validateName('가'.repeat(MAX_NAME))).toEqual([])
    expect(validateName('가'.repeat(MAX_NAME + 1))).toEqual([`이름은 ${MAX_NAME}자까지예요`])
  })

  it('형식은 묻지 않는다 — 복성·영문·외국인 이름도 받는다', () => {
    expect(validateName('남궁민수')).toEqual([])
    expect(validateName('John Kim')).toEqual([])
  })

  it('이모지도 한 글자로 센다', () => {
    expect(validateName('🍺'.repeat(MAX_NAME))).toEqual([])
  })
})

describe('이름(닉네임) 표시', () => {
  it('목록에선 실명 뒤에 카카오 닉네임을 괄호로 붙인다', () => {
    expect(nameWithNick({ displayName: '한서연', nickname: '🌸봄이🌸' })).toBe('한서연(🌸봄이🌸)')
  })

  it('닉네임이 없거나 실명과 같으면 이름만 쓴다', () => {
    expect(nameWithNick({ displayName: '정민수' })).toBe('정민수')
    expect(nameWithNick({ displayName: '최지영', nickname: '최지영' })).toBe('최지영')
  })

  it('목데이터 정산방의 참여자도 사람의 닉네임을 그대로 가진다', () => {
    expect(nameWithNick(participantOfUser(s().rooms[101], 2)!)).toBe('이민지(밍지🍺)')
  })
})

describe('이름 확인', () => {
  it('첫 로그인(목데이터의 나)은 이름 확인이 남아 있다', () => {
    expect(s().me.needsName).toBe(true)
  })

  it('확인하면 다시 묻지 않고, 보는 사람을 바꿨다 돌아와도 그대로다', () => {
    s().confirmName('김동구')
    expect(s().me).toMatchObject({ displayName: '김동구', needsName: false })
    s().actAs(2)
    s().actAs(1)
    expect(s().me).toMatchObject({ displayName: '김동구', needsName: false })
  })

  it('실명을 정해도 카카오 닉네임은 그대로 남는다', () => {
    s().confirmName('김동구')
    expect(s().me.nickname).toBe('동규짱')
  })

  it('앞뒤 공백은 지우고 저장한다', () => {
    s().confirmName('  김동구  ')
    expect(s().me.displayName).toBe('김동구')
  })

  it('내가 들어간 모든 정산방의 내 이름이 바뀐다 — 완료된 방도(서버는 users.display_name을 읽는다)', () => {
    s().confirmName('김동구')
    expect(participantOfUser(s().rooms[101], 1)?.displayName).toBe('김동구')
    expect(participantOfUser(s().rooms[102], 1)?.displayName).toBe('김동구')
    expect(participantOfUser(s().rooms[103], 1)?.displayName).toBe('김동구')
  })

  it('규칙에 안 맞는 이름은 저장하지 않는다', () => {
    s().confirmName('규')
    expect(s().me).toMatchObject({ displayName: '김동규', needsName: true })
  })

  it('링크로 처음 들어와 실명을 적고 참여하면 그 이름과 닉네임으로 명단에 들어간다', () => {
    s().actAs(6) // 한서연 — 101에 없다
    useV3.setState((st) => ({ me: { ...st.me, needsName: true } }))
    s().confirmName('한서윤')
    s().joinGathering('k7Qx2', [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'DRANK' }])
    expect(nameWithNick(participantOfUser(s().rooms[101], 6)!)).toBe('한서윤(🌸봄이🌸)')
    // 타임라인 문장엔 이름만
    expect(s().rooms[101].timeline.at(-2)!.body).toBe('한서윤님이 들어왔어요')
  })
})

describe('아바타 글자', () => {
  it('한글 세 글자 실명은 이름 첫 글자를 쓴다 — 김씨가 여럿이어도 구분된다', () => {
    expect(initialOf('김동규')).toBe('동')
    expect(initialOf('김민지')).toBe('민')
  })

  it('그 밖의 이름은 첫 글자', () => {
    expect(initialOf('남궁민수')).toBe('남')
    expect(initialOf('John Kim')).toBe('J')
  })
})
