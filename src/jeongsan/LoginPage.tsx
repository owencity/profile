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
import { Shell } from './ui'
import type { LoginProvider } from './v3/api'

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

export function LoginPage({ onLogin }: { onLogin: (provider: LoginProvider) => void }) {
  return (
    <Shell>
      <div className="js-login">
        <AppIcon />
        <div className="t">정산어택</div>
        <div className="hook">
          간단한 건 그대로 N분의 1 하면 되지만,
          <br />
          계산이 복잡해지면 총무분들은 계산이 힘들어집니다.
        </div>
        <div className="s">
          그래서 총무들의 고생을 위해 만든 정산 앱입니다.
          <br />
          총무를 위해 당신의 클릭 1스푼을 얹어주세요.
        </div>
      </div>

      <button className="js-cta kakao" style={{ marginTop: 20 }} onClick={() => onLogin('kakao')}>
        카카오로 3초만에 시작하기
      </button>
      {/* Apple 계정만 있는 사람(앱스토어 심사관 포함)도 웹 링크로 들어올 수 있게 — 앱의 Apple 로그인과 같은 계정이 된다 */}
      <button className="js-cta apple" onClick={() => onLogin('apple')}>
        <AppleMark /> Apple로 계속하기
      </button>
      {googleEnabled && (
        <button className="js-cta2 google" onClick={() => onLogin('kakao')}>
          구글로 시작하기
        </button>
      )}
    </Shell>
  )
}

/** Apple 로고(단색) — Apple 로그인 버튼 지침대로 글자 왼쪽에 둔다 */
export function AppleMark() {
  return (
    <svg width="15" height="18" viewBox="0 0 814 1000" aria-hidden="true" style={{ flex: 'none' }}>
      <path fill="currentColor" d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 201-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 789 0 671 0 559 0 380 117 285 232 285c61 0 112 40 150 40 37 0 94-43 164-43 26 0 122 3 185 92zM554 157c29-35 49-83 49-131 0-7-1-13-2-19-47 2-103 31-136 70-26 30-51 78-51 127 0 7 1 15 2 17 3 1 8 1 13 1 42 0 95-28 125-65z" />
    </svg>
  )
}
