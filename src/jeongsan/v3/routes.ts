/**
 * v3 첫 화면(H1 내 술자리) 경로인가.
 * `/jungsan/new`는 옛 "모임 만들기"였다 — v3에는 모임이 없으니 첫 화면으로 받는다.
 */
export const isV3Home = (route: string) => route === '/jungsan' || route === '/jungsan/' || route === '/jungsan/new'

/**
 * 링크로 들어오는 참여 입구(P1) — `/jungsan/j/{shareToken}`. **로그인 전에도** 열린다:
 * 단톡방 링크를 누른 사람이 술자리부터 보고, [참여]를 누를 때 로그인한다.
 */
export const isV3JoinRoute = (route: string) => /^\/jungsan\/j\/[^/]+$/.test(route)

/**
 * v3 라우터가 맡는 경로인가(참여 입구 제외). 옛 라우터(`JeongsanApp`)가 로그인 확인 뒤 이걸 보고
 * v3로 넘긴다. 알림함은 옛 `/jungsan/alerts`가 로그인 확인 앞에서 가로채므로 새 주소를 쓴다.
 */
export const isV3Route = (route: string) =>
  isV3Home(route) || route === '/jungsan/notifications' || route === '/jungsan/me/account' || /^\/jungsan\/r\//.test(route)
