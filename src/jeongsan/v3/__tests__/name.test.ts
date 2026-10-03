/**
 * L2 이름 확인 — 첫 로그인 때 한 번. 카카오 닉네임을 기본값으로 확인받고, 확인한 이름이 진행 중인 정산방에도 반영된다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { participantOfUser } from '../model'
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

  it(`${MAX_NAME}자까지 받는다 — 참여자 줄·알림 문구에서 깨지지 않는 길이`, () => {
    expect(validateName('가'.repeat(MAX_NAME))).toEqual([])
    expect(validateName('가'.repeat(MAX_NAME + 1))).toEqual([`이름은 ${MAX_NAME}자까지예요`])
  })

  it('이모지도 한 글자로 센다', () => {
    expect(validateName('🍺'.repeat(MAX_NAME))).toEqual([])
  })
})

describe('이름 확인', () => {
  it('첫 로그인(목데이터의 나)은 이름 확인이 남아 있다', () => {
    expect(s().me.needsName).toBe(true)
  })

  it('확인하면 다시 묻지 않고, 보는 사람을 바꿨다 돌아와도 그대로다', () => {
    s().confirmName('동규짱')
    expect(s().me).toMatchObject({ displayName: '동규짱', needsName: false })
    s().actAs(2)
    s().actAs(1)
    expect(s().me).toMatchObject({ displayName: '동규짱', needsName: false })
  })

  it('앞뒤 공백은 지우고 저장한다', () => {
    s().confirmName('  동규  ')
    expect(s().me.displayName).toBe('동규')
  })

  it('내가 들어간 모든 정산방의 내 이름이 바뀐다 — 완료된 방도(서버는 users.display_name을 읽는다)', () => {
    s().confirmName('동규짱')
    expect(participantOfUser(s().rooms[101], 1)?.displayName).toBe('동규짱')
    expect(participantOfUser(s().rooms[102], 1)?.displayName).toBe('동규짱')
    expect(participantOfUser(s().rooms[103], 1)?.displayName).toBe('동규짱')
  })

  it('규칙에 안 맞는 이름은 저장하지 않는다', () => {
    s().confirmName('가'.repeat(MAX_NAME + 1))
    expect(s().me).toMatchObject({ displayName: '동규', needsName: true })
  })

  it('링크로 처음 들어와 이름을 확인하고 참여하면 그 이름으로 명단에 들어간다', () => {
    s().actAs(6) // 서연 — 101에 없다
    useV3.setState((st) => ({ me: { ...st.me, needsName: true } }))
    s().confirmName('서연이')
    s().joinGathering('k7Qx2', [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'DRANK' }])
    expect(participantOfUser(s().rooms[101], 6)?.displayName).toBe('서연이')
    expect(s().rooms[101].timeline.at(-2)!.body).toBe('서연이님이 들어왔어요')
  })
})
