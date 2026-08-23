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

function ogMetaPlugin(appTarget: string): Plugin {
  const meta = SITE_META[appTarget] ?? SITE_META.default
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), ogMetaPlugin(env.VITE_APP_TARGET ?? '')],
  }
})
