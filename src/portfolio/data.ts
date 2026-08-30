export type ProjectStatus = '완료' | '시작 전'

export type ProjectDiagram = {
  src: string
  /** PDF 내보내기(html2canvas)는 <img src="*.svg">를 제대로 못 읽어서, 캡처용으로만 쓰는 래스터 버전 */
  pdfSrc: string
  alt: string
  caption: string
}

export type ProjectSolution = {
  label: string
  desc: string
  diagram?: ProjectDiagram
}

export type ProjectSolutionGroup = {
  title: string
  items: ProjectSolution[]
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
  diagram?: ProjectDiagram
  problem?: string
  solutions?: ProjectSolution[]
  solutionGroups?: ProjectSolutionGroup[]
  result?: ProjectResult
}

export const CATEGORY_STYLES: Record<string, string> = {
  아키텍처: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  '데이터 처리': 'bg-amber-50 text-amber-700 border-amber-100',
  마이그레이션: 'bg-purple-50 text-purple-700 border-purple-100',
  안정성: 'bg-rose-50 text-rose-700 border-rose-100',
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  완료: 'bg-emerald-100 text-emerald-800',
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
      '레거시 시스템(Java 1.6 · Seasar2 · MySQL 5) → Java 21 · Spring Boot · PostgreSQL 마이그레이션',
      '대용량 데이터 처리 성능 개선(청크 분할+커밋) — 10만 행 기준 30분+(미완료) → 23초로 단축',
      '스케줄러 폴링 → RabbitMQ 이벤트 기반 비동기 연동 아키텍처 전환, Prometheus·Loki·Grafana 모니터링 체계 구축',
      '비동기 메시지 처리 중 브로커 재배달로 인한 무한 재시도 발견 — 청크·처리예산·배달확인 시간을 3중 타임아웃으로 설계해 재발 차단',
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
      title: '외부 연동 비동기 아키텍처 전환',
      category: '아키텍처',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      period: '2025.05 ~ 2026.07',
      techStack: ['Java', 'Spring Boot', 'RabbitMQ', 'Prometheus', 'Loki', 'Grafana'],
      summary: [
        '스케줄러 폴링 방식의 외부 연동을 RabbitMQ 기반 이벤트 발행 구조로 전환해 동기/비동기 처리를 분리했습니다.',
        '전송 실패 건은 자동 재시도 후 DLQ로 격리해, 유실 없이 사후 재처리할 수 있게 설계했습니다.',
        'Prometheus·Loki·Grafana로 이상 징후를 규칙 기반으로 판정해 웹훅 알람까지 연결했습니다.',
      ],
      problem:
        '상품관리시스템과 자사몰 API 간 상품 데이터 연동을 스케줄러 폴링 방식으로 개발했는데, 자사몰 서버 장애 시 실패 건이 유실되고 수동 복구가 필요한 구조였습니다. 장애 1회가 연동 파이프라인 전체를 지연시켰습니다. 이 폴링 구조를 실패를 잃어버리지 않는 비동기 아키텍처로 다시 설계하는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '구조 전환',
          items: [
            {
              label: '이벤트 기반 연동으로 전환',
              desc: '상품 데이터가 상품관리시스템에 upsert되면, 최초등록이력·수정이력을 기준으로 자사몰에 반영할 대상을 판별합니다. 이 판별 결과를 실시간 연동과 새벽 배치 스케줄 두 트리거로 RabbitMQ에 발행하는 비동기 구조로 전환했습니다.',
              diagram: {
                src: '/projects/event-integration-system.svg',
                pdfSrc: '/projects/event-integration-system.png',
                alt: '웹 관리 콘솔에서 애플리케이션을 거쳐 운영 DB로 상품 데이터가 입력되는 경로와, 그 이력을 판별해 메시지 브로커와 컨슈머를 거쳐 외부 커머스 API로 반영하는 이벤트 기반 자사몰 연동 경로를 보여주는 시스템 구성도',
                caption:
                  '① 상품 데이터가 운영 DB에 입력되면, 최초등록이력·수정이력을 기준으로 자사몰 반영 대상을 판별합니다. ② 그 결과를 큐에 넣고 즉시 응답하므로 외부 플랫폼 장애가 사용자 화면 응답으로 전파되지 않고, 실패는 재시도 후 DLQ에 보존되어 알람으로 이어집니다.',
              },
            },
          ],
        },
        {
          title: '실패 격리',
          items: [
            {
              label: '재시도 후 DLQ 이관',
              desc: '전송 실패 시 자동으로 재시도하고, 재시도 횟수를 초과한 건은 Dead Letter Queue로 격리해 유실 없이 사후 재처리할 수 있도록 했습니다.',
              diagram: {
                src: '/projects/event-integration-flow.svg',
                pdfSrc: '/projects/event-integration-flow.png',
                alt: '동기화 트리거부터 대상 조회, 메시지 발행, 컨슈머 수신, 외부 API 호출을 거쳐 성공 시 완료 표시, 실패 시 재시도 3회 후 DLQ 이관과 알람으로 이어지는 순서도',
                caption:
                  '재시도는 즉시 반복하지 않고 백오프(10초→60초)를 두어 외부 장애를 악화시키지 않고, 소진된 메시지는 원문 그대로 DLQ에 남아 유실 없이 재처리할 수 있습니다.',
              },
            },
          ],
        },
        {
          title: '안정성 확보',
          items: [
            {
              label: '멱등성 설계',
              desc: 'at-least-once 전달로 인한 중복 전송에 대비해 멱등 처리를 설계했습니다. 재시도가 발생해도 중복 반영 없이 안전하게 처리됩니다.',
            },
            {
              label: '수동 재처리 지원',
              desc: '최종 실패한 작업은 실패 사유를 로그로 남기고, 담당자가 화면에서 직접 재시도할 수 있도록 제공했습니다.',
            },
          ],
        },
        {
          title: '관측성',
          items: [
            {
              label: '이상 탐지 · 웹훅 알람',
              desc: 'Prometheus·Loki·Grafana 조합으로 이상 징후를 규칙 기반으로 판정해 웹훅 알림으로 받는 구조를 만들었습니다. 장애를 사후에 로그로 확인하는 방식에서 벗어났습니다.',
            },
          ],
        },
      ],
      result: {
        note: '장애 1회로 연동 파이프라인 전체가 지연되던 구조에서, 실패 격리·자동 재시도·알람까지 갖춘 구조로 전환했습니다.',
      },
    },
    {
      slug: 'chunk-batch-optimization',
      title: '대용량 청크 처리 최적화',
      category: '데이터 처리',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'JDBC Batch', 'PostgreSQL'],
      summary: [
        '행이 늘수록 처리 시간이 비례보다 훨씬 가파르게 늘어나던 대용량 검사를 청크 커밋 구조로 바꿔, 10만 행 기준 30분 34초(미완료)를 23초로 줄였습니다.',
        '중복 검사처럼 쪼개면 안 되는 부분은 전역 1회로 남기고, 행 검증만 청크마다 반복했습니다.',
        '건당 조회로 24,000회 왕복하던 구조를 묶음 조회로 바꿔 48회로 줄였습니다.',
      ],
      problem:
        '상품 데이터를 엑셀로 업로드하면 행(상품 데이터 한 건)마다 중복·유효성 검증을 거치는데, 이 검사 시간이 행 수에 비례하지 않고 그보다 훨씬 가파르게 늘어났습니다. 10만 행짜리 업로드는 검사가 30분 34초가 지나도 끝나지 않아 측정을 취소해야 했습니다. 검사 로직은 그대로 두고 실행 구조만 바꿔 현실적인 시간 안에 끝내는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '실행 단위 분할',
          items: [
            {
              label: '청크 크기 실측 기반 선정',
              desc: '행 수가 2배로 늘면 시간은 3배 넘게 늘어난다는 걸 실측으로 확인했습니다(2,500행 0.83초 · 5,000행 2.56초 · 10,000행 8.84초 — 행 수에 비례했다면 10,000행은 3.32초여야 함). 한 번에 처리하는 행이 적을수록 행당 비용이 싸진다는 뜻이라, 큰 요청을 청크로 잘라 여러 번 도는 방식으로 바꿨습니다. 청크 크기는 한 건이 3초 안쪽에 끝나는 지점인 5,000을 골랐고, 상한을 20,000으로 둔 건 크기를 너무 키우면 청크로 나눈 효과 자체가 사라지기 때문입니다.',
              diagram: {
                src: '/projects/chunk-superlinear-curve.svg',
                pdfSrc: '/projects/chunk-superlinear-curve.png',
                alt: '행 수에 따른 검사 시간 그래프. 2,500행 0.83초, 5,000행 2.56초, 10,000행 8.84초로 선형 기준선보다 가파르게 증가하며, 5,000행씩 두 번 나눠 처리하면 10,000행을 5.12초에 끝낸다',
                caption:
                  '2,500/5,000/10,000행을 측정하면 선형 기준선보다 가파르게 늘어납니다. 같은 10,000행을 5,000행씩 두 번 나눠 처리하면 8.84초가 5.12초로 줄어듭니다.',
              },
            },
          ],
        },
        {
          title: '커밋 경계 설계',
          items: [
            {
              label: '청크마다 커밋 — 트랜잭션 전파 고정',
              desc: '검사는 같은 행을 여러 번 훑으며 판정을 갱신하는데, 한 트랜잭션 안에서는 갱신이 쌓여도 정리되지 않아 패스를 거듭할수록 훑어야 할 양이 계속 늘어났습니다(행이 늘수록 시간이 비례보다 더 가파르게 늘던 원인). 청크마다 커밋해 그 시점까지 쌓인 걸 정리하고, 다음 청크는 깨끗한 상태에서 스캔하도록 했습니다.',
              diagram: {
                src: '/projects/chunk-100k-comparison.svg',
                pdfSrc: '/projects/chunk-100k-comparison.png',
                alt: '10만 행 검사 소요 비교. 청크 방식은 23초에 완료, 통짜 호출은 30분 34초에도 미완료로 취소, 청크를 단일 트랜잭션 안에서 돌리면 26분에도 미완료로 취소',
                caption:
                  '10만 행 기준 통짜 호출은 30분 34초, 청크를 단일 트랜잭션 안에 넣어도 26분에 미완료였습니다. 청크마다 커밋했을 때만 23초에 끝나, 빨라진 건 "나눈 것"이 아니라 "커밋한 것"임을 확인했습니다.',
              },
            },
          ],
        },
        {
          title: '쪼개면 안 되는 부분 남기기',
          items: [
            {
              label: '전역 판정은 1회, 행 검증만 반복',
              desc: '중복 검사는 업로드 전체를 한 번에 봐야 해 청크 단위로는 찾을 수 없습니다. 전역 사전검증·외부 목록 조회는 1회로 남기고 행 검증만 청크마다 반복했으며, 실패한 청크가 있으면 마무리를 보류합니다.',
            },
          ],
        },
        {
          title: '청크 상태 관리',
          items: [
            {
              label: '중간에 끊겨도 이어서 처리',
              desc: '청크마다 커밋하는 대신 전체 롤백이라는 안전장치는 포기했습니다. 그래서 청크 처리 상태(대기·처리중·완료·실패)를 테이블에 기록해, 중간에 끊겨도 재실행 시 이미 끝난 청크는 건드리지 않고 남은 청크만 이어서 처리합니다. 실패한 청크는 사유를 남기고 3회까지 자동 재시도한 뒤, 그래도 안 되면 더 시도하지 않도록 고정합니다. 청크를 시작할 때 선점 표시를 남겨 같은 청크를 두 실행이 동시에 처리하는 것도 막습니다.',
            },
          ],
        },
        {
          title: '왕복 횟수 병목 해소',
          items: [
            {
              label: '건당 조회를 묶음 조회로',
              desc: '건당 1쿼리로 24,000회 왕복하던 걸 500건씩 묶어 조회하는 방식으로 바꿔 48회로 줄였습니다. 묶음 크기는 고정했습니다 — 크기가 매번 달라지면 실행계획이 재사용되지 않기 때문입니다. 묶음 조회는 결과 순서를 보장하지 않아, 키로 맵을 만들어 원래 순서대로 다시 담았습니다.',
            },
          ],
        },
      ],
      result: {
        before: '30분 34초 (미완료)',
        after: '23초',
        note: '10만 행 3-way 테스트 기준(사전검증 10.3초 + 청크 20회 + 마무리 0.03초). 100만 행 부하 테스트로 선형 확장성도 검증했습니다.',
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
    {
      slug: 'incident-response-data-integrity',
      title: '장애 대응 & 데이터 정합성',
      category: '안정성',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
      summary: [
        '컬럼 위치 가정이 만든 전량 유실 사고를 헤더 이름 기반 매칭으로 바꿔 재발을 차단했습니다.',
        '검증과 저장의 타입 불일치로 앞자리 0이 사라지는 사고를 원문 그대로 문자열로 다루도록 고쳤습니다.',
        '업로드 화면과 저장 프로시저에 흩어져 있던 이중 판정을 하나로 모아 10만 행도 질의 1회로 처리하게 했습니다.',
      ],
      problem:
        '엑셀 업로드 파이프라인은 "컬럼은 항상 같은 위치에 있다", "검증을 통과하면 저장도 안전하다", "판정은 한 곳만 맞으면 된다"는 가정 위에 있었고, 그 가정이 깨지며 상품코드 전량 유실(106행×4회 반려)·브랜드코드 매칭 실패(1,114행)·등록 판정 불일치(24행 반려) 세 갈래 사고로 이어졌습니다. 이 가정들을 걷어내고 재발하지 않는 구조로 다시 짜는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '위치 의존성 제거',
          items: [
            {
              label: '헤더 이름 기반 매칭',
              desc: '기준 열 왼쪽을 통째로 삭제하던 로직이 있었는데, 컬럼 순서가 재정의되며 기준 열이 밀리자 상품코드까지 삭제됐습니다(106행×4회 반려). 열 채택 기준을 "헤더 텍스트가 정의와 일치하는가" 하나로 바꿔 위치와 무관하게 읽도록 했습니다.',
              diagram: {
                src: '/projects/stability-position-loss.svg',
                pdfSrc: '/projects/stability-position-loss.png',
                alt: '종전에는 기준 열 왼쪽의 모든 컬럼이 삭제되어 상품코드가 유실됐고, 수정 후에는 헤더 텍스트로 매칭해 위치와 무관하게 모든 컬럼을 읽는다는 비교 도해',
                caption:
                  '빗금 친 다섯 칸이 종전 로직에서 사라지던 영역이고, 그 안에 상품코드가 있었습니다. 수정 후에는 위치와 상관없이 헤더 이름으로만 판단합니다.',
              },
            },
          ],
        },
        {
          title: '쓰기 단계 타입 안전성',
          items: [
            {
              label: '앞자리 0 보존',
              desc: '브랜드코드 002079처럼 형식 검증은 통과하지만 저장 시 수치형으로 변환되며 앞자리 0이 사라져 매칭이 실패하는 사고가 있었습니다(1,114행). 검증과 저장이 같은 정의를 보지 않은 게 원인이라, 자리 표기를 담는 값은 끝까지 문자열로 다루도록 고쳤습니다.',
            },
          ],
        },
        {
          title: '판정 로직 일원화',
          items: [
            {
              label: '이중 판정 통합',
              desc: '업로드 화면과 저장 프로시저가 등록 여부를 각자 다른 기준으로 판정해 결론이 어긋나 24행이 원인 불명으로 반려됐습니다. 판정 함수를 하나로 모으고, 행 단위 조회 대신 쌍 목록 전체를 집합 질의 1회로 대조해 10만 행이어도 질의 1회로 끝나도록 했습니다.',
              diagram: {
                src: '/projects/stability-dual-judgment.svg',
                pdfSrc: '/projects/stability-dual-judgment.png',
                alt: '종전에는 업로드 화면과 저장 프로시저가 각각 다른 기준으로 등록 모드를 판정해 결론이 어긋나 24행이 반려됐고, 수정 후에는 두 곳이 같은 판정 함수를 호출해 결론이 하나로 모인다는 비교 도해',
                caption:
                  '두 판정 모두 자기 기준으로는 정확했지만, 같은 질문에 답하는 코드가 두 벌 있다는 사실 자체가 결함이었습니다. 판정을 하나로 모으면서 성능 문제도 같이 풀렸습니다.',
              },
            },
          ],
        },
        {
          title: '재발 방지',
          items: [
            {
              label: '판정 기준을 위치에서 이름으로',
              desc: '"컬럼이 몇 개 연속으로 맞으면 검사 대상"이라는 위치 규칙은 3개와 4개를 가르는 근거가 없었습니다. 기준을 "이름이 정의에 있는가"로 바꿔 임계값을 없애고, 누락은 반려·정의 밖 열은 확인 요청·중복은 자동 선택, 세 갈래로 정리했습니다.',
            },
          ],
        },
      ],
      result: {
        before: '유실·반려 반복',
        after: '불일치 0건',
        note: '서식 충실도 감사 — 실제 양식 7종·49,696칸 전수 대조 결과 기준.',
      },
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
