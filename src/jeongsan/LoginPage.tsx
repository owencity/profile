/**
 * 주최자 로그인. `/jungsan` 진입 시 로그인 전이면 이 화면부터 나온다.
 *
 * 받는 정보는 **회원번호 · 닉네임 · 프로필 사진** 셋뿐이다.
 * 전부 카카오 기본 동의항목이라 **비즈앱 전환이 필요 없다.**
 * 이메일·실명·전화번호는 받지 않는다 — 알림은 FCM 이고 신원은 회원번호가 맡는다.
 */
import { Shell } from './ui'

/** 아이콘 시안 C — 딥블루 배경 + 오렌지 버스트 + ÷ */
function AppIcon({ size = 88 }: { size?: number }) {
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

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <Shell>
      <div className="js-login">
        <AppIcon />
        <div className="t">정산어택</div>
        <div className="s">
          1차, 2차로 끝나지 않는 술자리를
          <br />
          차수별로 나눠 계산합니다
        </div>
      </div>

      <div className="js-confirm" style={{ marginTop: 0 }}>
        <div className="ct">받는 정보는 이것뿐입니다</div>
        <ul>
          <li>닉네임 · 프로필 사진 — <b>동명이인을 구분하기 위한 것</b></li>
          <li>이메일 · 전화번호 · 실명은 <b>받지 않습니다</b></li>
        </ul>
      </div>

      <button className="js-cta kakao js-bottom" onClick={onLogin}>
        카카오로 시작하기
      </button>
      <button className="js-cta2 google" onClick={onLogin}>
        구글로 시작하기
      </button>
      <div className="js-footer">광고를 넣지 않습니다.</div>
    </Shell>
  )
}
