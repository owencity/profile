export type ProjectStatus = '확장 중' | '준비중'

export type Project = {
  name: string
  status: ProjectStatus
  summary: string
  details: string[]
}

export const profile = {
  name: '김동규',
  role: 'Backend Developer',
  brand: 'dev_kdk',
  avatarUrl: '/brand.png',
  intro:
    '“개발 = 코딩”이 아니라, 현실의 문제를 구조화하고 시스템으로 해결하는 과정이라고 믿습니다. 그래서 구현보다 설계/경계/흐름을 우선합니다.',
  links: {
    github: 'https://github.com/owencity',
    blog: 'https://owencity.tistory.com/',
  },
  valkyrieFs: {
    releaseLatestUrl: 'https://github.com/owencity/valkyrieFS/releases/latest',
    windowsInstallerUrl:
      'https://github.com/owencity/valkyrieFS/releases/latest/download/ValkyrieFS-Setup.exe',
    logoUrl: '/valkyriefs-wing.svg',
  },
  projects: [
    {
      name: 'ValkyrieFS',
      status: '확장 중',
      summary: 'Windows 전용 파일 검색 시스템 (C++ / Python)',
      details: [
        '파일을 빠르게 탐색/검색하기 위한 시스템입니다.',
        '다운로드 페이지에서 설치 파일을 제공하며, 윈도우 전용 시스템입니다. C++과 파이썬으로 개발되었습니다.',
      ],
    },
    {
      name: '24시간이모자라',
      status: '준비중',
      summary:
        '카페, 음식점, 전기차 충전소 등 24시간 운영하는 곳을 쉽게 찾아갈 수 있게 하는 웹앱',
      details: [
        '현재 개발 준비 중입니다.',
      ],
    },
  ] as Project[],
} as const

