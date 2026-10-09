/**
 * 개인정보처리방침(`/jungsan/privacy`)·지원(`/jungsan/support`) — 로그인 없이 열린다. 앱스토어·플레이스토어 심사에
 * 이 두 주소를 넣는다. 내용은 실제 동작과 같아야 한다(`legal.ts` 머리말).
 */
import { CONTACT_EMAIL, EFFECTIVE_DATE, OPERATOR, OVERSEAS_TRANSFERS, SERVER_LOCATION } from './legal'

export function PrivacyPage({ onHome }: { onHome: () => void }) {
  return (
    <article className="js-shell narrow js-legal">
      <header className="js-rtop"><button type="button" className="js-linkbtn" onClick={onHome}>정산어택 홈</button></header>
      <h1>정산어택 개인정보처리방침</h1>
      <p className="js-legal-meta">시행일 {EFFECTIVE_DATE}</p>
      <p>정산어택(이하 "서비스")은 술자리 비용을 차수별로 나누어 정산하는 데 필요한 최소한의 개인정보만 처리합니다.</p>

      <h2>1. 처리하는 개인정보</h2>
      <table>
        <thead><tr><th>언제</th><th>항목</th></tr></thead>
        <tbody>
          <tr><td>카카오로 로그인할 때</td><td>카카오 회원번호, 닉네임, 프로필 사진 주소</td></tr>
          <tr><td>Apple로 로그인할 때</td><td>Apple 사용자 식별자</td></tr>
          <tr><td>처음 시작할 때(직접 입력)</td><td>실명 — 정산방에서 쓰는 이름</td></tr>
          <tr><td>돈을 받는 사람이 될 때(직접 입력)</td><td>받을 계좌: 은행, 계좌번호, 예금주</td></tr>
          <tr><td>서비스를 쓰는 동안</td><td>참여한 술자리, 차수별 응답(불참·논알코올·알코올), 정산 금액, 송금 상태, 정산방 메시지, 받은 스푼 수</td></tr>
          <tr><td>자동으로</td><td>접속 기록(IP 주소, 접속 시각) — 장애 확인과 부정 이용 방지에만 씁니다</td></tr>
        </tbody>
      </table>
      <p>이메일, 전화번호, 카드 정보는 받지 않습니다. 서비스는 송금을 대신하지 않으며 결제 정보를 처리하지 않습니다.</p>

      <h2>2. 이용 목적</h2>
      <ul>
        <li>로그인과 회원 식별</li>
        <li>차수별 정산 금액 계산과 안내, 송금 상태 확인</li>
        <li>정산 진행 알림(정산 완료, 입금 확인 요청 등)</li>
      </ul>

      <h2>3. 다른 참여자에게 보이는 정보</h2>
      <ul>
        <li>같은 술자리 참여자에게: 실명과 카카오 닉네임, 차수별 응답, 정산 금액과 송금 상태, 정산방 메시지</li>
        <li>받을 계좌: <b>그 사람에게 돈을 보내야 하는 참여자에게만</b> 보입니다</li>
      </ul>

      <h2>4. 보관 기간과 파기</h2>
      <ul>
        <li>술자리와 그 안의 정보(차수, 응답, 금액, 송금 상태, 메시지): <b>정산 완료 7일 뒤</b> 삭제합니다.
          완료되지 않은 술자리는 마지막 활동 후 <b>30일</b>이 지나면 삭제합니다.</li>
        <li>계정 정보(로그인 정보, 실명, 받을 계좌, 스푼 수): <b>탈퇴하면 지체 없이</b> 삭제합니다.
          다른 사람과 함께한 지난 정산 기록에서는 이름이 &lsquo;탈퇴한 사용자&rsquo;로 바뀌고, 직접 쓴 메시지는 지웁니다.</li>
        <li>삭제한 정보는 복구할 수 없는 방법으로 지웁니다.</li>
      </ul>

      <h2>5. 제3자 제공과 처리 위탁</h2>
      <p>개인정보를 제3자에게 제공하지 않습니다. 서비스 운영을 위해 다음 업체를 이용합니다.</p>
      <table>
        <thead><tr><th>업체</th><th>하는 일</th></tr></thead>
        <tbody>
          <tr><td>Oracle Cloud Infrastructure</td><td>서버와 데이터베이스 보관 ({SERVER_LOCATION})</td></tr>
          <tr><td>Vercel</td><td>웹 화면 제공(접속 기록)</td></tr>
          <tr><td>카카오, Apple</td><td>로그인 인증</td></tr>
        </tbody>
      </table>

      <h3>국외 이전</h3>
      <p>서비스 운영을 위해 아래와 같이 개인정보를 국외로 이전합니다(개인정보 보호법 제28조의8).</p>
      <table>
        <thead><tr><th>받는 곳</th><th>내용</th></tr></thead>
        <tbody>
          {OVERSEAS_TRANSFERS.map((t) => (
            <tr key={t.to}>
              <td>{t.to}<br />({t.country})</td>
              <td>
                항목: {t.items}<br />
                목적: {t.purpose}<br />
                시기·방법: {t.when}<br />
                보관 기간: {t.period}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>국외 이전을 원하지 않으면 서비스 이용을 멈추고 탈퇴할 수 있습니다. 다만 서버가 국외에 있어 이전 없이는 서비스를 제공할 수 없습니다.
        문의: {CONTACT_EMAIL}</p>

      <h2>6. 이용자의 권리</h2>
      <ul>
        <li>언제든 자신의 정보를 열람하고, 정정·삭제를 요청할 수 있습니다.</li>
        <li>앱에서 바로 탈퇴할 수 있습니다(내 술자리 → 내 계정 · 로그아웃 · 탈퇴). 진행 중인 정산이 있으면 끝난 뒤에 탈퇴할 수 있습니다.</li>
        <li>실명은 앱에서 바꿀 수 없습니다. 잘못 입력했다면 아래로 문의해 주세요.</li>
      </ul>

      <h2>7. 안전하게 지키는 방법</h2>
      <ul>
        <li>모든 통신은 암호화(HTTPS)됩니다.</li>
        <li>계좌번호는 암호화해 저장하고, 볼 수 있는 사람(그 사람에게 돈을 보내야 하는 참여자)을 제한하며, 로그에 남기지 않습니다.</li>
      </ul>

      <h2>8. 이용 대상</h2>
      <p>서비스는 술자리 정산을 위한 것으로 만 19세 이상을 대상으로 합니다.</p>

      <h2>9. 개인정보 보호책임자와 문의</h2>
      <p>보호책임자: {OPERATOR}<br />문의: {CONTACT_EMAIL}</p>

      <h2>10. 바뀌는 경우</h2>
      <p>이 방침이 바뀌면 시행 7일 전부터 이 페이지에 알립니다.</p>
    </article>
  )
}

export function SupportPage({ onHome }: { onHome: () => void }) {
  return (
    <article className="js-shell narrow js-legal">
      <header className="js-rtop"><button type="button" className="js-linkbtn" onClick={onHome}>정산어택 홈</button></header>
      <h1>정산어택 고객 지원</h1>
      <p>궁금한 점이나 문제가 있으면 이메일로 알려주세요. 영업일 기준 2일 안에 답장드립니다.</p>
      <p className="js-legal-contact">{CONTACT_EMAIL}</p>

      <h2>자주 묻는 질문</h2>
      <h3>이름을 잘못 입력했어요</h3>
      <p>실명은 입금자명과 맞춰 보는 데 쓰여서 앱에서 바꿀 수 없습니다. 위 이메일로 알려주시면 고쳐 드립니다.</p>
      <h3>받을 계좌를 바꾸고 싶어요</h3>
      <p>내 술자리 화면 위쪽의 계좌 줄을 누르면 언제든 바꿀 수 있습니다.</p>
      <h3>술자리 기록은 언제 사라지나요?</h3>
      <p>정산이 끝나고 7일 뒤에 사라집니다. 완료되지 않은 술자리는 30일 동안 아무 활동이 없으면 사라집니다.</p>
      <h3>다음 차는 다른 사람이 계산했어요</h3>
      <p>계산한 사람이 정산방에서 [다음 차는 내가 계산했어요]를 누르고 같이 간 사람을 고르면, 그 차수부터 따로 정산됩니다.</p>
      <h3>탈퇴하고 싶어요</h3>
      <p>내 술자리 화면에서 이름 아래 [내 계정 · 로그아웃 · 탈퇴]를 누르고, 맨 아래 [회원 탈퇴]를 두 번 누르면 됩니다.
        진행 중인 정산이 있으면 끝난 뒤에 탈퇴할 수 있습니다.</p>
      <p><a href="/jungsan/privacy">개인정보처리방침 보기</a></p>
    </article>
  )
}
