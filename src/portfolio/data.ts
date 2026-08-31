export type ProjectStatus = '완료' | '진행 중' | '시작 전'

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

export type ProjectGroup = {
  name: string
  period?: string
  projects: PortfolioProject[]
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
  '사이드 프로젝트': 'bg-sky-50 text-sky-700 border-sky-100',
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  완료: 'bg-emerald-100 text-emerald-800',
  '진행 중': 'bg-blue-100 text-blue-800',
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
  projectGroups: [{
    name: '상품관리 시스템 고도화',
    period: '2025.06 ~ 2026.08',
    projects: [
    {
      slug: 'legacy-stack-migration',
      title: '레거시 스택 마이그레이션',
      category: '마이그레이션',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'Spring Boot', 'React', 'PostgreSQL', 'Jenkins', 'Docker'],
      summary: [
        'Seasar2 서버사이드 렌더링 구조를 React+Spring Boot로 분리하며, AI 코드 변환 지원을 받아 프레임워크 전환보다 기능 검수에 더 많은 시간을 썼습니다.',
        'MySQL 5→PostgreSQL 전환에서 pgloader로 옮긴 뒤 어긋난 타입과 GROUP BY 같은 SQL 문법 차이를 하나씩 교정했습니다.',
        '3개월 분석 후 작은 기능부터 검증하며 약 2개월간 마이그레이션을 실행해, 신규 기능 개발 기간을 1주일에서 2~3일로 줄였습니다.',
      ],
      diagram: {
        src: '/projects/legacy-infra-architecture.svg',
        pdfSrc: '/projects/legacy-infra-architecture.png',
        alt: '종전에는 JSP와 Seasar2가 MySQL 5를 거쳐 VMware 온프레미스 환경에 수동으로 배포됐고, 이후에는 Git과 Jenkins를 거쳐 IDC 온프레미스 서버에 자동 빌드·배포되며, React와 Spring Boot가 PostgreSQL과 통신하고 Spring Boot가 RabbitMQ를 거쳐 자사몰 API와 연동하는 인프라 구성 비교도',
        caption:
          '개발부터 배포까지 Git·Jenkins로 자동화하고, 클라이언트 요청 흐름과 외부 연동(RabbitMQ)을 분리했습니다. 인프라는 그대로 온프레미스(VMware→IDC)를 유지하면서, 수동 배포에서 자동 빌드·배포 파이프라인으로 바꿨습니다.',
      },
      problem:
        '입사 3개월 차에, 타사에서 인계받은 노후 소스코드(Java 1.6·Seasar2·MySQL 5)를 최신 스택으로 전환하는 마이그레이션을 맡았습니다. Seasar2는 서버사이드 렌더링 구조라 화면단을 React로 완전히 분리하는 아키텍처 전환이 필요했고, 기존과 똑같이 동작해야 한다는 제약 속에서 기능 하나 놓치지 않고 옮기는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '프레임워크 전환 — SSR에서 React + Spring Boot로',
          items: [
            {
              label: 'AI 보조 코드 변환 + 꼼꼼한 기능 검수',
              desc: 'Seasar2의 서버사이드 렌더링 구조를 React(프론트)와 Spring Boot(백엔드)로 분리하는 전환이었습니다. 프레임워크 자체의 코드 변환은 AI 도구의 코드 분석·변환 지원으로 크게 어렵지 않았지만, 마이그레이션 후에도 기존과 동일하게 동작해야 했기 때문에 기능 하나하나를 검수하며 발견되는 차이를 고치는 데 가장 많은 시간을 썼습니다. 난이도보다는 시간이 드는 작업이었습니다.',
            },
          ],
        },
        {
          title: 'DB 전환 — MySQL 5 → PostgreSQL',
          items: [
            {
              label: 'pgloader 변환 후 타입·SQL 수동 교정',
              desc: 'pgloader로 1차 변환했지만 두 DB의 타입 체계가 완전히 일치하지 않아, 어긋난 데이터 타입을 하나씩 검수하며 수정했습니다. SQL도 다수 손봤는데, 예를 들어 MySQL은 GROUP BY에 없는 컬럼도 느슨하게 SELECT를 허용하지만 PostgreSQL은 이를 엄격히 막아, 해당 쿼리들을 전부 표준에 맞게 고쳤습니다.',
            },
          ],
        },
        {
          title: '전환 전략 — 분석 → 소규모 검증 → 실행',
          items: [
            {
              label: '3개월 분석 후 작은 기능으로 먼저 검증',
              desc: '인계받은 코드를 3개월간 분석하며 시스템 흐름과 기능을 익혔고, 작은 기능 하나를 먼저 마이그레이션해 실현 가능성을 확인한 뒤 본격적으로 전환을 진행했습니다. 실제 마이그레이션 실행에는 약 2개월이 걸렸습니다.',
            },
          ],
        },
        {
          title: '배포 자동화',
          items: [
            {
              label: 'Jenkins · Docker 도입',
              desc: '빌드·배포 로직을 셸 스크립트(sh)에 정리하고 Docker로 감싸, Jenkins가 이 스크립트를 실행해 IDC 서버에 한 번에 빌드·배포하는 파이프라인을 구성했습니다. 수동으로 진행하던 배포가 자동화되며 소요 시간이 20분에서 5분으로 줄었습니다.',
            },
          ],
        },
      ],
      result: {
        before: '신규 기능 개발 1주일',
        after: '2~3일',
        note: '배포도 Jenkins·Docker 도입으로 20분에서 5분으로 줄었습니다. 별도로 측정한 수치가 아니라 실무를 진행하며 직접 확인한 수치입니다.',
      },
    },
    {
      slug: 'event-driven-integration',
      title: '외부 연동 비동기 아키텍처 전환',
      category: '아키텍처',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
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
          title: '메시지 설계',
          items: [
            {
              label: '데이터가 아니라 작업 지시만 담기',
              desc: '메시지에 옵션 수만 건 같은 데이터 전체를 담으면, 재시도 시점엔 그 값이 이미 낡아 외부에 오래된 값이 덮어써질 수 있습니다. 그래서 메시지에는 이력번호·대상일자·실행모드 같은 "무엇을 할지"만 담고(약 100B), 컨슈머가 처리 시점에 DB를 다시 읽어 항상 최신 값을 반영하도록 했습니다. 외부 API는 한 번에 100건까지만 받아, 메시지 1건이 컨슈머 안에서 100건씩 N회 호출로 펼쳐집니다.',
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
          title: '무한 재시도 차단',
          items: [
            {
              label: '청크 < 처리 예산 < 배달 확인, 3중 타임아웃',
              desc: '컨슈머가 메시지를 오래 붙잡으면 브로커가 컨슈머가 죽었다고 판단해 메시지를 회수해 다시 배달하는데, 그러면 작업이 처음부터 다시 시작되고 재시도 횟수도 초기화되어 3회 제한에 영원히 닿지 않는 무한 재시도가 됩니다. 청크(0.6~0.8초) < 처리 예산(60분) < 배달 확인(3시간) 순으로 예산을 겹쳐 안쪽 층이 항상 먼저 스스로 멈추도록 했고, 재시도 단위도 메시지가 아니라 청크로 낮춰 실패한 청크만 다시 처리하게 했습니다.',
              diagram: {
                src: '/projects/integration-time-budget.svg',
                pdfSrc: '/projects/integration-time-budget.png',
                alt: '컨슈머의 처리 예산이 브로커의 배달 확인 대기 시간보다 짧으면 스스로 멈추고 이어서 처리하지만, 순서가 뒤집히면 브로커가 먼저 메시지를 회수해 처음부터 다시 시작하고 재시도 횟수도 초기화되어 무한 반복이 된다는 비교 도해',
                caption:
                  '청크 < 처리 예산 < 브로커 배달 확인 순으로 예산을 겹쳐야 안쪽이 먼저 멈춥니다. 순서가 뒤집히면 브로커가 먼저 회수해 처음부터 다시 시작하고, 재시도 횟수도 초기화돼 3회 제한에 닿지 못한 채 조용히 자원만 계속 먹습니다.',
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
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
      summary: [
        '스프레드시트를 통째로 여는 대신 행 단위로 읽고 1,000건씩 묶어 저장해 메모리 사용량을 줄였습니다.',
        '부분 성공을 허용하지 않는 전량 원복 정책으로 반쯤 갱신된 상태를 근본적으로 차단했습니다.',
        '검증을 반영 앞으로 옮긴 앞단 게이트로, 값 하나의 오류가 전체를 무산시키는 정책의 대가를 상쇄했습니다.',
      ],
      problem:
        '엑셀 업로드는 마스터 데이터를 반영하는 작업이라 부분 성공을 허용하면 반쯤 갱신된 상태가 남고, 무엇이 반영됐는지 알 수 없어 재실행도 위험했습니다. 그렇다고 스프레드시트를 통째로 객체로 열면 행 수에 비례해 메모리를 먹는 구조가 됩니다. 유실 없는 전량 반영과 메모리 사용량을 동시에 잡는 파이프라인을 설계하는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '메모리 사용량 최소화',
          items: [
            {
              label: '행 단위 읽기, 묶음 단위 쓰기',
              desc: '스프레드시트를 통째로 객체로 열면 행 수에 비례해 메모리를 먹습니다. 대신 행이 읽힐 때마다 콜백을 받아 처리하고, 저장은 1,000건씩 묶어 넣어 순서를 보존하면서 진행률도 표시합니다. 다만 저장 전 전체 검증이 필요해 파싱 결과 자체는 아직 전량 메모리에 모이는데, 이 지점을 숨기지 않고 그대로 남겨둔 개선 여지로 표시했습니다.',
              diagram: {
                src: '/projects/excel-pipeline-memory.svg',
                pdfSrc: '/projects/excel-pipeline-memory.png',
                alt: '엑셀 업로드 파이프라인 5단계와 각 단계에서 동시에 메모리에 올라가는 양. 읽기 단계는 행 하나씩이라 얕지만 파싱 결과 누적부터 저장까지는 전량을 보유한다',
                caption:
                  '읽기와 쓰기는 이미 묶음 단위입니다. 남은 것은 가운데 구간 — 읽으면서 바로 저장하면 보유량이 상수가 되지만, 지금은 엑셀 순서 보존과 저장 전 전체 검증 때문에 파싱 결과를 전량 들고 있습니다.',
              },
            },
          ],
        },
        {
          title: '원자성 정책',
          items: [
            {
              label: '전량 반영 아니면 전량 원복',
              desc: '부분 성공을 허용하면 반쯤 갱신된 상태가 남고, 재실행해도 무엇이 이미 반영됐는지 알 수 없습니다. 그래서 전량 원복 정책으로 고정했는데, 그 대가로 값 하나의 타입 오류가 전량을 무산시키게 됩니다. 검증을 반영보다 앞(트랜잭션 밖)에 두는 앞단 게이트로 이 대가를 상쇄해, 해당 행만 반려하고 한 행 때문에 전량이 무산되지 않게 했습니다. 원복 전에는 실패 사유를 로그로 남겨 원인을 추적할 수 있게 했습니다.',
              diagram: {
                src: '/projects/excel-atomic-revert.svg',
                pdfSrc: '/projects/excel-atomic-revert.png',
                alt: '부분 갱신을 허용하면 반쯤 갱신된 상태가 남고 전량 원복은 직전 상태를 보존한다는 비교. 아래에는 값 하나의 타입 오류가 전량을 무산시키던 문제를 앞단 검증 게이트로 상쇄한 흐름과, 원복 전에 실패 사유를 로그로 내보내는 처리',
                caption:
                  '전량 원복은 몇 번을 다시 올려도 결과가 같다는 장점이 있지만, 값 하나의 오류가 전체를 막는 대가가 있습니다. 검증을 반영 앞으로 옮겨 해당 행만 반려하게 하면, 원자성을 유지하면서도 그 대가를 줄일 수 있습니다.',
              },
            },
          ],
        },
      ],
      result: {
        note: '행 단위 읽기·묶음 저장으로 메모리 사용량을 줄이고, 앞단 검증 게이트로 전량 원복 정책의 대가(한 건의 오류가 전체를 막는 것)를 상쇄했습니다.',
      },
    },
    {
      slug: 'zero-downtime-schema-migration',
      title: '무중단 스키마 마이그레이션',
      category: '마이그레이션',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['PostgreSQL'],
      summary: [
        '컬럼명을 한 번에 바꾸지 않고 확장→전환→수축 3단계로 나눠 무중단으로 표준화했습니다.',
        '한 공급사 저장이 다른 공급사 가격을 덮어쓰던 결함을 발견해, 저장 스코프를 상품+공급사로 교정했습니다.',
        'UNIQUE 제약과 NULL의 유일성 예외를 이용해 백필 없이 무중단으로 재발을 차단했습니다.',
      ],
      problem:
        '운영 중인 상품 테이블에는 의미가 불명확한 컬럼명(단위·길이단위 등)이 있었고, 한 상품에 여러 공급사가 각자 다른 가격을 갖도록 데이터 모델을 넓히는 과정에서 저장 스코프가 상품 단위로만 걸려 있어 한 공급사가 저장하면 다른 공급사의 가격까지 조용히 덮어쓰는 결함도 드러났습니다(오류가 아니라 화면엔 성공으로 표시됨). 서비스 중단이나 백필 없이 컬럼명을 정리하고, 같은 사고가 재발하지 않도록 불변식을 스키마 제약으로 옮기는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '컬럼명 표준화',
          items: [
            {
              label: '확장 → 전환 → 수축, 3단계',
              desc: '이름을 한 번에 바꾸면 배포 순간 신·구 코드가 공존하는 몇 초 동안 한쪽이 없는 컬럼을 참조하게 됩니다. 새 컬럼을 추가해 양쪽에 쓰기(①), 읽기를 새 컬럼으로 전환(②), 충분히 관찰한 뒤 옛 컬럼을 삭제(③)하는 3단계로 나눴습니다. 핵심은 2단계에서 멈춰 있어도 시스템이 정상 동작한다는 것입니다.',
              diagram: {
                src: '/projects/migration-expand-contract.svg',
                pdfSrc: '/projects/migration-expand-contract.png',
                alt: '1단계에서 새 컬럼을 추가해 옛 컬럼과 공존시키고 양쪽에 쓰기, 2단계에서 읽기를 새 컬럼으로 전환, 3단계에서 옛 컬럼을 삭제하는 확장 후 수축 마이그레이션 도해',
                caption:
                  '2단계(전환)에서는 쓰기는 여전히 양쪽에, 읽기만 새 컬럼으로 옮겨 언제든 되돌릴 수 있는 상태를 오래 유지합니다. 되돌릴 수 없는 3단계(삭제)는 충분히 관찰한 뒤 마지막에 수행합니다.',
              },
            },
          ],
        },
        {
          title: '재발 방지 — 불변식을 스키마 제약으로',
          items: [
            {
              label: 'NULL의 유일성 예외로 무중단 제약 추가',
              desc: '저장 스코프를 상품+공급사로 교정해 대상이 항상 0 또는 1행이 되도록 한 뒤, 코드가 매번 방어하는 대신 UNIQUE(상품, 공급사)·UNIQUE(상품, 순위) 제약으로 같은 사고가 재발할 수 없게 했습니다. 순위 미지정 값(NULL)은 유일성 비교에서 서로 다른 값으로 취급되는 성질을 이용해, 기존 데이터를 전부 미지정으로 남긴 채 백필 없이 제약을 추가했습니다.',
              diagram: {
                src: '/projects/migration-scope-constraint.svg',
                pdfSrc: '/projects/migration-scope-constraint.png',
                alt: '상품 기준으로만 갱신하면 다른 공급사 가격을 덮어쓰지만 상품과 공급사 기준으로 좁히면 대상이 0 또는 1행이 된다는 비교. 아래에는 두 개의 유일성 제약과 대표를 1순위로 정의한 이유, 허용 상태를 전부 자동 또는 전부 수동 둘로 좁힌 설계',
                caption:
                  '대표를 따로 표시하지 않고 "대표 = 1순위"로 정의해 모순 상태 자체를 표현할 수 없게 했고, 순위는 전부 자동이거나 전부 수동인 상태만 허용해 섞인 상태를 만들지 않았습니다.',
              },
            },
          ],
        },
      ],
      result: {
        before: '상품 기준 갱신 — 덮어쓰기 결함',
        after: '제약으로 재발 차단',
        note: '컬럼명 변경은 배포 시점 참조 오류 없이, 제약 추가는 백필 없이 무중단으로 반영했습니다.',
      },
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
  }, {
    name: '정산어택',
    projects: [
      {
        slug: 'jeongsan-attack',
        title: '정산어택',
        category: '사이드 프로젝트',
        status: '진행 중',
        org: '개인 사이드 프로젝트',
        techStack: [],
        summary: [],
      },
    ] as PortfolioProject[],
  }] as ProjectGroup[],
}

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return portfolio.projectGroups.flatMap((g) => g.projects).find((p) => p.slug === slug)
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
