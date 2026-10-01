/**
 * v3 화면 공용 뒤로가기. ‹ 기호만으로는 버튼인지 알아보기 어려웠다(CTO 피드백) —
 * "뒤로가기"를 글자로 쓰고, 어디로 가는지는 title(마우스를 올리면 보임)로 알려준다.
 */
type Props = {
  onClick: () => void
  /** 어디로 돌아가는가 — 예: "정산방으로" */
  to: string
}

export function BackButton({ onClick, to }: Props) {
  return (
    <button type="button" className="js-backbtn" onClick={onClick} title={to}>
      <span aria-hidden="true">‹</span> 뒤로가기
    </button>
  )
}
