/**
 * 이용약관 동의 체크(FC-024) — 첫 로그인(L2 이름 확인, 링크 참여 P1의 이름 칸)에서 받는다. 약관은 새 탭으로 열어
 * 입력하던 이름·응답이 사라지지 않게 한다. 앱 `TermsAgree`(V3Components.kt)와 같은 문구.
 */
export function TermsAgree({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="js-terms">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <a href="/jungsan/terms" target="_blank" rel="noreferrer">이용약관</a>에 동의합니다. 욕설·비방·음란물 같은 부적절한 메시지는
        허용되지 않으며, 신고되면 지워지고 이용이 제한될 수 있어요.
      </span>
    </label>
  )
}
