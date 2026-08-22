export type ProjectStatus = '진행 중' | '시작 전'

export type ProjectSolution = {
  label: string
  desc: string
}

export type ProjectResult = {
  before?: string
  after?: string
  note?: string
}

export type PortfolioProject = {
  slug: string
  title: string
  category: string
  status: ProjectStatus
  org: string
  period?: string
  techStack: string[]
  summary: string[]
  problem?: string
  solutions?: ProjectSolution[]
  result?: ProjectResult
}

export const CATEGORY_STYLES: Record<string, string> = {
  아키텍처: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  '데이터 처리': 'bg-amber-50 text-amber-700 border-amber-100',
  마이그레이션: 'bg-purple-50 text-purple-700 border-purple-100',
  안정성: 'bg-rose-50 text-rose-700 border-rose-100',
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  '진행 중': 'bg-emerald-100 text-emerald-800',
  '시작 전': 'bg-zinc-100 text-zinc-600',
}

export const portfolio = {
  headline: '백엔드 개발자 김동규 포트폴리오',
  photoUrl: '/portfolio-avatar.jpg',
  mascotUrl: '/brand.png',
  introParagraphs: [
    '복잡한 레거시를 풀고 안정적인 서비스 기반을 만드는 백엔드 개발자 김동규입니다.',
    '연매출 250억 규모의 유통 커머스 플랫폼에서 10년간 누적된 기술 부채를 해결하는 마이그레이션 프로젝트를 주도했습니다. 타사에서 인계받은 노후 소스코드와 50여 개의 복잡한 상품 데이터 테이블을 전수 분석하여, 도메인에 맞게 30개 수준으로 통합·재설계했습니다. 추가 개발이 불가능했던 상품관리시스템을 최신 아키텍처로 마이그레이션하고, 안정적인 자사몰 API 연동과 모니터링 환경을 구축하여 서비스 장애율을 낮췄습니다.',
  ],
  contact: {
    email: 'skyko6530@gmail.com',
    githubLabel: 'github.com/owencity',
    githubUrl: 'https://github.com/owencity',
  },
  career: {
    startDate: '2025-03-01',
    company: '유통업 · Backend Developer',
    period: '2025.03 ~ 재직 중 · 정규직 · 개발팀',
    bullets: [
      '유통 상품 관리 시스템 마이그레이션 및 기능 고도화 프로젝트 (2025.05~2026.07)',
      'DBMS 선정부터 대용량 배치, 비동기 연동, 무중단 마이그레이션까지 설계~운영 전담',
      'PIM팀과 협업해 데이터 컬럼을 정리하고 자사몰 API 연동을 구축 — 상품 정보 갱신 프로세스를 9단계에서 2단계로 축소 (약 78% 단축)',
    ],
  },
  education: {
    school: '서영대학교 보건행정과',
    period: '2017.02 ~ 2019.02 졸업',
    bootcamp: '백엔드 자바 부트캠프 · 2024.01 ~ 2024.06',
    certificates: ['정보처리기사 · 2024.12'],
  },
  skills: {
    backend: ['Java', 'Spring Boot', 'JPA', 'PostgreSQL', 'MySQL', 'RabbitMQ'],
    tools: ['AWS', 'Docker', 'Git', 'OCI', 'Prometheus', 'Loki', 'Grafana'],
  },
  projects: [
    {
      slug: 'event-driven-integration',
      title: '외부 연동 아키텍처 — 폴링에서 이벤트 기반으로',
      category: '아키텍처',
      status: '진행 중',
      org: '유통 상품 관리 시스템 고도화',
      period: '2025.05 ~ 2026.07',
      techStack: ['Java', 'Spring Boot', 'RabbitMQ', 'Prometheus', 'Loki', 'Grafana'],
      summary: [
        '스케줄러 폴링 방식의 외부 연동을 RabbitMQ 기반 이벤트 발행 구조로 전환해 동기/비동기 처리를 분리했습니다.',
        '전송 실패 건은 자동 재시도 후 DLQ로 격리해, 유실 없이 사후 재처리할 수 있게 설계했습니다.',
        'Prometheus·Loki·Grafana로 이상 징후를 규칙 기반으로 판정해 웹훅 알람까지 연결했습니다.',
      ],
      problem:
        '스케줄러 폴링 방식은 자사몰 서버 장애 시 실패 건이 유실되고 수동 복구가 필요한 구조였습니다. 장애 1회가 연동 파이프라인 전체를 지연시켰습니다.',
      solutions: [
        {
          label: '동기/비동기 분리',
          desc: 'RabbitMQ 기반 이벤트 발행 구조로 전환해 비동기 실시간 연동을 구현했습니다.',
        },
        {
          label: '실패 격리 (DLQ)',
          desc: '전송 실패 시 자동으로 재시도하고, 재시도 횟수를 초과한 건은 Dead Letter Queue로 격리해 유실 없이 사후 재처리할 수 있도록 했습니다.',
        },
        {
          label: '멱등성 설계',
          desc: 'at-least-once 전달로 인한 중복 전송에 대비해 멱등 처리를 설계했습니다. 재시도가 발생해도 중복 반영 없이 안전하게 처리됩니다.',
        },
        {
          label: '운영',
          desc: '최종 실패한 작업은 실패 사유를 로그로 남기고, 담당자가 화면에서 직접 재시도할 수 있도록 제공했습니다.',
        },
        {
          label: '관측성',
          desc: 'Prometheus·Loki·Grafana 조합으로 이상 징후를 규칙 기반으로 판정해 웹훅 알림으로 받는 구조를 만들었습니다. 장애를 사후에 로그로 확인하는 방식에서 벗어났습니다.',
        },
      ],
      result: {
        note: '장애 1회로 연동 파이프라인 전체가 지연되던 구조에서, 실패 격리·자동 재시도·알람까지 갖춘 구조로 전환했습니다.',
      },
    },
    {
      slug: 'incident-response-data-integrity',
      title: '장애 대응 & 데이터 정합성',
      category: '안정성',
      status: '시작 전',
      org: '유통 상품 관리 시스템 고도화',
      techStack: [],
      summary: [],
    },
    {
      slug: 'chunk-batch-optimization',
      title: '대용량 청크 처리 최적화',
      category: '데이터 처리',
      status: '진행 중',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'JDBC Batch', 'PostgreSQL'],
      summary: [
        '단건 INSERT로 처리하던 대용량 적재를 Chunk 단위 분할 전송·커밋 구조로 재설계했습니다.',
        '청크 크기는 임의로 정하지 않고, 초선형으로 증가하는 처리 시간 곡선을 직접 측정해 근거를 만들었습니다.',
        '10만 행 3-way 테스트에서 30분 이상 걸리던 처리를 23초로 단축했습니다.',
      ],
      problem:
        '외부 업체 데이터 8만 건 적재가 화면과 동기로 묶여 있어, 완료까지 담당자가 다른 업무를 하지 못했습니다. 단건 INSERT의 건당 round-trip 비용이 누적되어 처리 시간이 건수에 비례해 증가하는 구조였습니다.',
      solutions: [
        {
          label: '청크 상태 전이',
          desc: '부분 실패에 대비해 배치 상태 기록 테이블로 재처리 구조를 확보했습니다. 재개·재시도·동시 실행 방어까지 고려해 설계했습니다.',
        },
      ],
      result: {
        before: '30분 이상',
        after: '23초',
        note: '10만 행(컬럼 수 100개가량, 실데이터 기준 1000만) 3-way 테스트 기준. 100만 행 부하 테스트로 선형 확장성도 검증했습니다.',
      },
    },
    {
      slug: 'excel-upload-pipeline',
      title: '엑셀 업로드 파이프라인',
      category: '데이터 처리',
      status: '시작 전',
      org: '유통 상품 관리 시스템 고도화',
      techStack: [],
      summary: [],
    },
    {
      slug: 'zero-downtime-schema-migration',
      title: '무중단 스키마 마이그레이션',
      category: '마이그레이션',
      status: '시작 전',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['PostgreSQL'],
      summary: [
        '컬럼 표준화를 서비스 중단 없이 진행하기 위해 확장(Expand) → 수축(Contract) 방식으로 마이그레이션합니다.',
      ],
    },
  ] as PortfolioProject[],
}

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return portfolio.projects.find((p) => p.slug === slug)
}

export function formatCareerDuration(startDate: string): string {
  const start = new Date(startDate)
  const now = new Date()
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `총 ${remainingMonths}개월`
  if (remainingMonths === 0) return `총 ${years}년`
  return `총 ${years}년 ${remainingMonths}개월`
}
