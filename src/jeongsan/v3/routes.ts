/** v3 라우터가 맡는 경로인가. 옛 라우터(`JeongsanApp`)가 이걸 보고 v3로 넘긴다. */
export const isV3Route = (route: string) => /^\/jungsan\/r\//.test(route)
