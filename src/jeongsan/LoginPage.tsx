/**
 * 주최자 로그인 겸 소개 화면. `/jungsan` 진입 시 로그인 전이면 여기부터 나온다.
 *
 * 받는 정보는 **회원번호 · 닉네임 · 프로필 사진** 셋뿐이다.
 * 전부 카카오 기본 동의항목이라 **비즈앱 전환이 필요 없다.**
 * 이메일·실명·전화번호는 받지 않는다 — 알림은 FCM 이고 신원은 회원번호가 맡는다.
 *
 * 설명은 SPEC §1이 정한 두 가지 차별점을 그대로 쓴다.
 *   ① 입력을 총무 혼자 하지 않는다
 *   ② 결과에 근거를 함께 보여준다
 * 여기에 "N빵이 아니다"를 앞에 세웠다 — 첫 문장에서 무엇이 다른지 말해야 한다.
 */
import { googleEnabled } from './api'
import { PixelCitySky } from './PixelCitySky'
import { Shell } from './ui'

/** 아이콘 시안 C — 딥블루 배경 + 오렌지 버스트 + ÷ */
export function AppIcon({ size = 88 }: { size?: number }) {
  // 11갈래 코믹 폭발. icon2.html 의 burst() 와 같은 방식으로 좌표를 만든다.
  const star = (r: number) => {
    const n = 11
    let p = ''
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
      const rr = i % 2 ? r * 0.54 : r * (0.92 + (i % 4 ? 0.08 : 0))
      p += `${i ? 'L' : 'M'}${(256 + Math.cos(a) * rr).toFixed(1)} ${(262 + Math.sin(a) * rr).toFixed(1)} `
    }
    return `${p}Z`
  }
  // ÷ 를 도형으로: 위 점 / 막대 / 아래 점
  const div = (
    <>
      <circle cx="256" cy="172" r="37" />
      <rect x="126" y="236" width="260" height="52" rx="26" />
      <circle cx="256" cy="352" r="37" />
    </>
  )

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ borderRadius: '23%' }}>
      <defs>
        <linearGradient id="jsBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B96E4" />
          <stop offset="45%" stopColor="#2C74D6" />
          <stop offset="100%" stopColor="#1B4F9C" />
        </linearGradient>
        <linearGradient id="jsOr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD9A8" />
          <stop offset="34%" stopColor="#FFB03A" />
          <stop offset="100%" stopColor="#FF9A3D" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#jsBg)" />
      <circle cx="438" cy="86" r="52" fill="#fff" opacity=".12" />
      <circle cx="68" cy="432" r="32" fill="#fff" opacity=".1" />
      <path d={star(258)} fill="#fff" opacity=".95" />
      <path d={star(224)} fill="#FFB03A" />
      <g transform="rotate(-8 256 262)">
        <g fill="none" stroke="#fff" strokeWidth="46" strokeLinejoin="round">{div}</g>
        <g fill="none" stroke="#C4741A" strokeWidth="26" strokeLinejoin="round">{div}</g>
        <g fill="url(#jsOr)">{div}</g>
      </g>
    </svg>
  )
}

const FEATURES = [
  {
    t: 'N빵으로 나누지 않습니다',
    d: (
      <>
        3차에서 누가 빠졌고 4차에서 누가 술을 안 마셨는지까지{' '}
        <em>차수별로 나눠</em> 계산합니다.
      </>
    ),
  },
  {
    t: '총무 혼자 입력하지 않습니다',
    d: (
      <>
        총무는 <em>금액만</em> 넣습니다. 누가 어디에 있었고 술을 마셨는지는{' '}
        <em>각자 링크에서</em> 체크합니다.
      </>
    ),
  },
  {
    t: '금액만 알려주지 않습니다',
    d: (
      <>
        <em>“1차 참석·논알콜 → 17,800원”</em> 처럼 왜 그 금액인지 근거를 함께 보여줍니다.
      </>
    ),
  },
]

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <Shell>
      <div className="js-hero">
        <PixelCitySky />
        <div className="js-login">
          <AppIcon />
          <div className="t">정산어택</div>
          <div className="s">1차, 2차로 끝나지 않는 술자리를 위해</div>
        </div>
      </div>

      <div className="js-feats">
        {FEATURES.map((f, i) => (
          <div className="js-feat" key={f.t}>
            <div className="no">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div className="ft">{f.t}</div>
              <div className="fd">{f.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="js-badge">
        참여자는 <b>앱을 설치하지 않습니다.</b> 링크로 들어와 웹에서 체크합니다.
      </div>

      <button className="js-cta kakao" style={{ marginTop: 20 }} onClick={onLogin}>
        카카오로 시작하기
      </button>
      {googleEnabled && (
        <button className="js-cta2 google" onClick={onLogin}>
          구글로 시작하기
        </button>
      )}

      <div className="js-footer">
        닉네임과 프로필 사진만 받습니다 · 이메일·전화번호·실명은 받지 않습니다
        <br />
        <b style={{ color: 'var(--ink2)' }}>광고를 넣지 않습니다.</b>
      </div>
    </Shell>
  )
}
