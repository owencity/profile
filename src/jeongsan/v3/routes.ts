/**
 * v3 첫 화면(H1 내 술자리) 경로인가.
 * `/jungsan/new`는 옛 "모임 만들기"였다 — v3에는 모임이 없으니 첫 화면으로 받는다.
 */
export const isV3Home = (route: string) => route === '/jungsan' || route === '/jungsan/' || route === '/jungsan/new'

/** v3 라우터가 맡는 경로인가. 옛 라우터(`JeongsanApp`)가 로그인 확인 뒤 이걸 보고 v3로 넘긴다. */
export const isV3Route = (route: string) => isV3Home(route) || /^\/jungsan\/r\//.test(route)
