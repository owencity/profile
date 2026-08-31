/**
 * 모임 참여 — `/gr/{token}` 으로 들어온다. `API.md` §3-b.4
 *
 * **술자리 참여(`/g/{token}`)와 다르다.** 저쪽은 "이번 술자리 정산에 낄게"이고,
 * 이쪽은 "이 모임의 멤버가 될게"다. 모임에 들어와야 다음 술자리부터 자동으로
 * 명단에 뜬다 — 매번 링크를 다시 받지 않아도 된다.
 *
 * 그래서 여기서는 **금액 얘기를 하지 않는다.** 아직 정산할 게 없다.
 * 누가 부르는지, 지금 누가 있는지만 보여주고 들어올지 말지를 묻는다.
 */
import { useState } from 'react'
import type { GroupDetail } from '../types'
import { Shell } from '../ui'
import { AppIcon } from '../LoginPage'

export function JoinGroupPage({
  group, onJoin, onOpenGathering,
}: {
  group: GroupDetail
  onJoin: (name: string) => void
  /** 이미 멤버라면 바로 진행 중인 술자리로 갈 수 있게 한다. */
  onOpenGathering?: (id: number) => void
}) {
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)

  const owner = group.members.find((m) => m.role === 'OWNER')
  const flash = group.groupType === 'FLASH'
  // 번개는 술자리가 하나뿐이라, 들어오면 바로 그리로 보내는 게 자연스럽다.
  const only = flash ? group.gatherings[0] : undefined

  if (joined) {
    return (
      <Shell narrow>
        <div className="js-login" style={{ paddingTop: 28 }}>
          <AppIcon size={64} />
          <div className="t" style={{ fontSize: 22 }}>참여 완료</div>
          <div className="s">
            <b>{group.name}</b> 의 멤버가 되었습니다.
            <br />
            다음 술자리부터 명단에 자동으로 올라갑니다.
          </div>
        </div>

        {only && onOpenGathering && (
          <button className="js-cta js-bottom" onClick={() => onOpenGathering(only.id)}>
            진행 중인 술자리 보기
          </button>
        )}
        {!only && (
          <div className="js-hint" style={{ textAlign: 'center', marginTop: 18 }}>
            총무가 술자리를 열면 카톡으로 링크가 옵니다.
          </div>
        )}
      </Shell>
    )
  }

  return (
    <Shell narrow>
      <div className="js-login" style={{ paddingTop: 28 }}>
        <AppIcon size={64} />
        <div className="t" style={{ fontSize: 22 }}>{group.name}</div>
        <div className="hook" style={{ fontSize: 14 }}>
          {owner ? `${owner.nickname} 님이 초대했습니다` : '초대를 받았습니다'}
        </div>
        <div className="s">
          {flash
            ? '한 번 모이는 번개입니다. 정산이 끝나면 목록에서 사라집니다.'
            : '계속 만나는 모임입니다. 한 번 들어오면 다음 술자리부터 자동으로 명단에 오릅니다.'}
        </div>
      </div>

      {/* 지금 누가 있는지 — 모르는 방에 들어가는 불안을 줄인다 */}
      <div className="js-lab">지금 참여 중 · {group.members.length}명</div>
      <div className="js-chips">
        {group.members.map((m) => (
          <span key={m.userId} className={`js-chip${m.role === 'OWNER' ? ' own' : ''}`}>
            {m.nickname}
            {m.role === 'OWNER' && <b> · 총무</b>}
          </span>
        ))}
      </div>

      <div className="js-lab">이름</div>
      <input
        className="js-inp"
        value={name}
        placeholder="명단에 보일 이름"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="js-hint">
        카카오 닉네임 대신 <b>실제로 부르는 이름</b>을 적어주세요 — 총무가 알아볼 수 있어야 합니다.
      </div>

      <button
        className="js-cta js-bottom"
        disabled={!name.trim()}
        style={name.trim() ? undefined : { opacity: 0.45 }}
        onClick={() => {
          onJoin(name.trim())
          setJoined(true)
        }}
      >
        참여하기
      </button>
    </Shell>
  )
}
