import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 배포 타겟(VITE_APP_TARGET)별 index.html 메타 태그.
 *
 * 사이트 전체가 index.html 하나를 공유해서, 카카오 크롤러는 www.devkdk.com이든
 * jungsan.devkdk.com이든 항상 똑같은 og:title/description을 봤다 — 정산어택
 * 링크를 카톡에 올려도 포트폴리오 소개만 뜨는 원인이었다.
 *
 * 독립 배포를 가르는 데 이미 쓰고 있는 VITE_APP_TARGET을 그대로 재사용해서
 * 빌드 시점에 배포별로 다른 메타 태그를 넣는다 — 새 환경변수를 안 늘려도 된다.
 */
const SITE_META: Record<string, { title: string; description: string; image: string; url: string }> = {
  default: {
    title: '김동규 | Backend Developer',
    description:
      '백엔드 개발자 김동규의 개인 사이트 — 개발 철학과 프로젝트(ValkyrieFS, 24시간이모자라)를 소개합니다.',
    image: 'https://www.devkdk.com/brand.png',
    url: 'https://www.devkdk.com/',
  },
  jeongsan: {
    title: '정산어택',
    description:
      '같이 놀고 같이 먹는데 왜 총무만 고생을 해야하냐! 총무들의 고생을 위해 만든 정산 앱입니다.',
    image: 'https://jungsan.devkdk.com/jungsan-og.png',
    url: 'https://jungsan.devkdk.com/',
  },
}

/**
 * @param isDev 개발 서버인가.
 *
 * **개발 서버에서는 항상 default 를 쓴다.** 이 태그들은 카톡·구글 크롤러를 위한
 * 것인데, 크롤러는 localhost 를 못 긁는다. 반면 로컬에서는 포트폴리오와 정산어택이
 * 한 오리진(localhost:5173)을 공유해서, 정산어택 제목을 박아버리면 포트폴리오
 * 화면의 탭에도 "정산어택"이 뜬다. 실제로 그렇게 보였다.
 *
 * 그래서 로컬에서는 정적 태그를 중립(포트폴리오)으로 두고, 정산어택 경로의 제목은
 * JeongsanApp 이 런타임에 바꾸게 맡긴다. 배포 빌드는 지금까지와 똑같다.
 */
function ogMetaPlugin(appTarget: string, isDev: boolean): Plugin {
  const meta = (isDev ? SITE_META.default : SITE_META[appTarget]) ?? SITE_META.default
  return {
    name: 'og-meta',
    transformIndexHtml(html) {
      return html
        .replaceAll('%OG_TITLE%', meta.title)
        .replaceAll('%OG_DESCRIPTION%', meta.description)
        .replaceAll('%OG_IMAGE%', meta.image)
        .replaceAll('%OG_URL%', meta.url)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), ogMetaPlugin(env.VITE_APP_TARGET ?? '', command === 'serve')],
  }
})
