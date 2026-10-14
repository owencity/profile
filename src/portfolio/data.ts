export type ProjectStatus = '완료' | '진행 중' | '시작 전'

export type ProjectDiagram = {
  src: string
  /** PDF 내보내기(html2canvas)는 <img src="*.svg">를 제대로 못 읽어서, 캡처용으로만 쓰는 래스터 버전 */
  pdfSrc: string
  alt: string
  caption?: string
  /** 지정하면 도해 전체가 이 주소로 가는 링크가 된다 */
  href?: string
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
  kind: '회사 프로젝트' | '사이드 프로젝트'
  period?: string
  projects: PortfolioProject[]
}

/** 개조식 불릿. sub로 한 단계 중첩, diagram으로 그 항목 바로 아래 도해를 붙인다. */
export type ProjectBullet = {
  text: string
  sub?: string[]
  diagram?: ProjectDiagram
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
  /** 맨 위 diagram 바로 다음에 이어서 렌더링되는 추가 도해들 */
  diagrams?: ProjectDiagram[]
  problem?: string
  solutions?: ProjectSolution[]
  solutionGroups?: ProjectSolutionGroup[]
  result?: ProjectResult
  /** 개조식 구조. 지정하면 problem/solutionGroups/result 대신 이쪽이 렌더링된다. */
  problemPoints?: ProjectBullet[]
  solutionPoints?: ProjectBullet[]
  resultPoints?: ProjectBullet[]
  links?: { label: string; url: string }[]
  /** true면 화면·PDF에는 노출하지 않되 데이터는 남겨둔다(재정리 예정 등) */
  hidden?: boolean
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
  photoUrl: '/portfolio-avatar.jpg',
  mascotUrl: '/brand.png',
  introParagraphs: [
    '레거시 전환을 직접 제안해 주도하고, 10만 행 대량 데이터 검증 시간을 98% 이상 단축하며, 현업 사용자와 요구사항을 구체화하고 데이터 처리 성능·정합성·시스템 연동을 개선해 온 Java/Spring 백엔드 개발자입니다.',
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
    project: '상품 마스터 데이터 관리 시스템(PIM/MDM) 구축·운영',
  },
  education: {
    degree: '컴퓨터공학 학사 (학점은행제 · 국가평생교육진흥원)',
    degreePeriod: '2027.03 졸업 예정',
    priorSchool: '서영대학교 보건행정과',
    priorSchoolPeriod: '2017.02 ~ 2019.02 졸업',
    bootcamp: '백엔드 자바 부트캠프 · 2024.01 ~ 2024.06',
    certificates: ['정보처리기사 · 2024.12'],
  },
  skills: {
    backend: ['Java', 'Kotlin', 'Spring Boot', 'JPA', 'PostgreSQL', 'MySQL', 'RabbitMQ', 'Kafka'],
    tools: ['Docker', 'Jenkins', 'GitHub Actions', 'n8n', 'Git', 'OCI', 'Prometheus', 'Loki', 'Grafana'],
  },
  projectGroups: [
    {
      name: '상품 마스터 데이터 관리 시스템(PIM/MDM) 구축',
      kind: '회사 프로젝트',
      period: '2025.06 ~ 2026.08',
      projects: [
      {
        slug: 'legacy-stack-migration',
        title: '레거시 마이그레이션',
        category: '마이그레이션',
        status: '완료',
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Nginx', 'Jenkins', 'Docker', 'Loki', 'Grafana'],
        summary: [
          'Java 1.6·Seasar2·MySQL 5를 Java 21·Spring Boot 3.4·PostgreSQL 16으로 전환하며, 기존과 동일하게 동작해야 해 기능 검수에 가장 많은 시간을 썼습니다.',
          'Blue-Green 배포와 별도 복구 파이프라인을 구성해, 이전 환경 복구를 10분에서 30초로 줄였습니다.',
          '3개월 분석 후 작은 기능부터 검증하며 전환해, 신규 기능 개발·반영 기간을 7일에서 2일로 71% 줄였습니다.',
          '매입처별 가격으로 모델을 넓히며 드러난 덮어쓰기 결함을 저장 스코프 교정과 UNIQUE 제약으로 차단했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/legacy-infra-architecture.svg',
            pdfSrc: '/projects/legacy-infra-architecture.png',
            alt: '종전에는 JSP와 Seasar2가 서버사이드 렌더링으로 MySQL 5를 거쳐 VMware 온프레미스에 수동 배포되는 한 덩어리 구조였다. 신규 구조에서는 Client 요청이 IDC 서버의 Nginx로 들어와 경로에 따라 갈라진다. 일반 요청은 프론트엔드 정적 자산으로, /api 요청은 Docker로 띄운 Spring Boot로 바로 전달된다. Spring Boot는 같은 Docker 안의 PostgreSQL과 통신하고 RabbitMQ를 거쳐 외부 자사몰 API와 연동한다. 관측 스택인 Loki와 Grafana도 같은 Docker 안에 애플리케이션과 분리된 별도 컨테이너로 떠 있어, 앱을 배포하거나 재시작해도 로그 수집이 끊기지 않는다. Grafana의 알림 규칙은 웹훅으로 연결돼, 조건에 걸리면 메신저로 알림이 발송된다.',
          },
          {
            src: '/projects/blue-green-deploy.svg',
            pdfSrc: '/projects/blue-green-deploy.png',
            alt: 'Blue-Green 무중단 배포 도해. 1단계 배포 중에는 Nginx가 운영 중인 Blue(현재 버전)로만 트래픽을 보내고, Green(새 버전)은 Jenkins 빌드 단계의 헬스체크를 30초 간격 5회 연속 통과할 때까지 트래픽을 받지 않는다. 2단계 전환에서는 Nginx가 트래픽을 Green으로 넘기고 Blue는 지우지 않고 직전 환경으로 그대로 남겨둔다. 문제가 생기면 다시 빌드하지 않고 트래픽만 Blue로 되돌려 30초 안에 복구한다.',
          },
        ],
        problemPoints: [
          {
            text: 'Seasar2는 일본에서 주로 쓰이던 프레임워크로 2016년에 지원이 끝나, 문제가 생겨도 참고할 자료가 거의 없어 사실상 스스로 해결할 수 없는 구간이 생겼습니다.',
          },
          {
            text: '신규 기능을 추가하려 할 때마다 프레임워크와 런타임의 한계에 부딪혔습니다. 배포한 버전에 문제가 생기면 다시 빌드해서 올려야 해 복구에 10분이 걸렸습니다.',
          },
          {
            text: '시스템에 문제가 생기면 서버에 직접 들어가 로그를 찾아야 했고, 원인을 확인하는 데만 많은 시간이 걸렸습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '전환 전략 — PoC로 검증하고, 구조 분석 후 옮긴 뒤, 전부 대조 검수',
            sub: [
              '직접 마이그레이션을 제안하고, 작은 기능 하나로 실현 가능성을 검증한 뒤 전환을 주도했습니다.',
              'Seasar2를 Spring Boot 3.4로 전환했습니다. 분석해 보니 둘 다 DI·AOP 컨테이너 위에 올라간 계층 구조라 구조가 비슷해, 옮기는 데 큰 문제는 없었습니다. 기존 흐름을 먼저 파악한 뒤 코드 변환은 AI 도구(클로드 코드)에 지시해 빠르게 진행했습니다.',
              '대신 변환 결과를 그대로 믿지 않고, 수십 개 기능 중 로직이 복잡한 부분에는 테스트 코드를 짜고 E2E 테스트를 같이 진행해 기존 동작과 대조하며 검수·교정했습니다. 이 검수·교정이 전환 작업에서 가장 많은 시간을 차지했습니다.',
            ],
          },
          {
            text: '관측 — 로그 시스템 도입',
            sub: [
              '관측 스택은 애플리케이션과 분리된 컨테이너로 띄웠습니다. 같이 묶어두면 앱이 죽을 때 원인을 볼 수단도 함께 사라지고, 배포로 컨테이너를 갈아끼울 때마다 로그가 끊기기 때문입니다.',
            ],
          },
          {
            text: '무중단 배포 — Blue-Green으로 전환하고, 복구 경로를 분리',
            sub: [
              '애플리케이션을 두 벌 띄워두고, Nginx가 보내는 트래픽을 새 버전 쪽으로 넘기는 Blue-Green 방식으로 바꿨습니다.',
              '"정상 응답"을 사람 판단에 맡기지 않으려고 헬스체크 엔드포인트를 만들고, Jenkins 빌드 단계에서 30초 간격 5회 연속 정상일 때만 트래픽을 전환하도록 했습니다.',
              '직전 환경을 그대로 남겨둔 채 트래픽만 되돌리는 복구 파이프라인을 별도로 두어, 되돌리는 일이 재빌드가 아니라 트래픽 전환으로 끝나게 했습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '신규 기능 개발·반영: 7일 → 2일 (71% 단축) — 기능을 더 빠르게 반영하면서, 담당 부서의 업무 요청 처리 속도도 함께 빨라졌습니다.',
          },
          {
            text: '장애 시 이전 환경 복귀: 10분 → 30초 (95% 단축) — 복구가 빨라진 만큼 다운타임이 줄어, 사용자가 장애를 겪는 시간도 짧아졌습니다.',
          },
          {
            text: '로그가 한곳에 모이고 알림이 붙으면서, 시스템 문제를 확인하는 시간이 1~2분에서 10초로 줄었습니다 (83% 이상 단축).',
          },
        ],
      },
      {
        slug: 'postgresql-vs-mysql-benchmark',
        title: 'DB 선택 — PostgreSQL vs MySQL 직접 측정',
        category: '마이그레이션',
        status: '완료',
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['PostgreSQL', 'MySQL', 'sysbench', 'Python'],
        summary: [
          '"PostgreSQL이 다 낫다"는 말을 그대로 받아들이지 않고, 5가지 가설을 세워 동일 리소스·동일 데이터로 직접 측정했습니다.',
          '측정 도중 드라이버 비대칭으로 수치가 부풀려진 걸 스스로 발견해, 양쪽을 네이티브 C 드라이버로 맞추고 재측정했습니다.',
          '복잡한 조인·분석은 PostgreSQL이 최대 69배 빨랐고, 동시 재고차감 정합성 테스트에서 MySQL만 257건의 과다판매가 발생해 이를 결정적 근거로 PostgreSQL을 선택했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/db-benchmark-infra.svg',
            pdfSrc: '/projects/db-benchmark-infra.png',
            href: 'https://github.com/owencity/PostgreSQL_MySQL',
            alt: '로컬 Docker 환경에서 PostgreSQL 16과 MySQL 8.4를 버퍼 1.5GB로 개발·반복하지만 자원을 공유해 검증력이 약하고, 동일 compose에 OCI 오버라이드를 적용해 OCI 4vCPU·24GB 전용 환경(버퍼 6GB)에서 같은 사양으로 한 번 더 측정한다. GitHub Actions가 workflow_dispatch로 SSH·rsync를 통해 OCI에서 run_all.sh를 실행시키고 결과를 아티팩트로 회수하는 구성도',
          },
          {
            src: '/projects/db-benchmark-oltp.svg',
            pdfSrc: '/projects/db-benchmark-oltp.png',
            alt: 'sysbench 4종 워크로드(point_select, insert, read_only, read_write) 처리량 비교. 모든 항목에서 PostgreSQL이 MySQL보다 높지만 격차는 항목마다 다르다',
          },
          {
            src: '/projects/db-benchmark-join.svg',
            pdfSrc: '/projects/db-benchmark-join.png',
            alt: '7개 테이블 조인 실행시간 비교. 주문 200만 행에서 MySQL 23.5초 대 PostgreSQL 5.8초로 4.0배, 주문 607만 행에서 MySQL 85.5초 대 PostgreSQL 18.1초로 4.7배 격차',
          },
          {
            src: '/projects/db-benchmark-analytics.svg',
            pdfSrc: '/projects/db-benchmark-analytics.png',
            alt: '집계·정렬 중심 분석 쿼리 4종의 실행시간 비교(log 스케일). 월별집계 7배, 상품누적 38배, 고객상위 21배, 최대 테이블(1300만 행) 입출고 이력 69배로 PostgreSQL이 빠르다',
          },
          {
            src: '/projects/db-benchmark-mvcc.svg',
            pdfSrc: '/projects/db-benchmark-mvcc.png',
            alt: '동시 쓰기 처리량(commits/sec) 비교. 드라이버가 비대칭이던 오염 측정에서는 MySQL 839 대 PostgreSQL 1,210으로 1.44배 격차였으나, 양쪽 모두 네이티브 C 드라이버로 공정화한 뒤에는 MySQL 946 대 PostgreSQL 1,150으로 1.22배로 줄었다',
          },
          {
            src: '/projects/db-benchmark-lost-update.svg',
            pdfSrc: '/projects/db-benchmark-lost-update.png',
            alt: '동일 REPEATABLE READ 조건에서 동시 재고차감을 반복했을 때 MySQL은 257건의 과다판매가 발생했고 PostgreSQL은 0건이었다는 막대 비교',
          },
          {
            src: '/projects/db-benchmark-summary.svg',
            pdfSrc: '/projects/db-benchmark-summary.png',
            alt: '단순 조회 1.65배, 동시 쓰기 1.22배, insert 3.88배, 대규모 JOIN 4.73배, 대규모 분석 68.6배로 항목별 PostgreSQL 우위 배율을 로그 스케일로 정리한 막대 그래프',
          },
        ],
        problemPoints: [
          {
            text: '마이그레이션 중이라 DB를 바꿀 수 있는 시점이었습니다. MySQL 5는 쓰는 데 문제가 없었지만, 새 시스템에 그대로 가져갈지 PostgreSQL로 갈지는 정해야 했습니다.',
          },
          {
            text: 'MySQL 5에는 걸리는 제약이 있었습니다. GROUP BY에 없는 컬럼도 느슨하게 허용해 의도와 다른 쿼리가 오류 없이 통과했고, CHECK 제약은 선언해도 무시돼 불변식을 스키마로 고정할 수 없었습니다.',
          },
          {
            text: 'CTE와 윈도우 함수도 지원하지 않아, 집계·순위 계산을 애플리케이션 코드로 끌고 와야 했습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '한 번 정하면 되돌리기 어려운 선택이라, 개인적으로 측정을 진행했습니다. 다섯 가지 항목을 세워 두 엔진을 같은 조건에서 비교했습니다.',
          },
        ],
        resultPoints: [
          {
            text: '단순 조회의 꼬리 지연만 MySQL이 더 안정적이었고, 복잡 조인 4.7배·대규모 분석 최대 69배로 나머지 항목은 PostgreSQL이 월등히 앞섰습니다.',
          },
          {
            text: '동시 재고차감에서 MySQL은 과다판매 257건, PostgreSQL은 0건이었습니다.',
          },
          {
            text: '지연시간을 뺀 모든 항목에서 우위가 분명해, 직접 측정한 결과를 근거로 PostgreSQL 도입을 결정했습니다.',
          },
        ],
      },
      {
        slug: 'event-driven-integration',
        title: '자사몰 연동 비동기 전환',
        category: '아키텍처',
        status: '완료',
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java', 'Spring Boot', 'RabbitMQ', 'Prometheus', 'Loki', 'Grafana'],
        summary: [
          '스케줄러 폴링 방식의 외부 연동을 RabbitMQ 기반 이벤트 발행 구조로 전환해 동기/비동기 처리를 분리했습니다.',
          '전송 실패 건은 자동 재시도 후 DLQ로 격리해, 유실 없이 사후 재처리할 수 있게 설계했습니다.',
          'Prometheus·Loki·Grafana로 이상 징후를 규칙 기반으로 판정해 웹훅 알람까지 연결했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/event-integration-system.svg',
            pdfSrc: '/projects/event-integration-system.png',
            alt: '웹 관리 콘솔에서 애플리케이션을 거쳐 운영 DB로 상품 데이터가 입력되는 경로와, 그 이력을 판별해 메시지 브로커와 컨슈머를 거쳐 외부 커머스 API로 반영하는 이벤트 기반 자사몰 연동 경로를 보여주는 시스템 구성도',
          },
          {
            src: '/projects/event-integration-flow.svg',
            pdfSrc: '/projects/event-integration-flow.png',
            alt: '동기화 트리거부터 대상 조회, 메시지 발행, 컨슈머 수신, 외부 API 호출을 거쳐 성공 시 완료 표시, 실패 시 재시도 3회 후 DLQ 이관과 알람으로 이어지는 순서도',
          },
          {
            src: '/projects/integration-time-budget.svg',
            pdfSrc: '/projects/integration-time-budget.png',
            alt: '컨슈머의 처리 예산이 브로커의 배달 확인 대기 시간보다 짧으면 스스로 멈추고 이어서 처리하지만, 순서가 뒤집히면 브로커가 먼저 메시지를 회수해 처음부터 다시 시작하고 재시도 횟수도 초기화되어 무한 반복이 된다는 비교 도해',
          },
        ],
        problemPoints: [
          {
            text: '자사몰 API 연동을 스케줄러 폴링으로 돌렸는데, 자사몰이 한 번 장애를 겪으면 그 사이 실패한 건이 유실되고 수동 복구가 필요했습니다.',
          },
          {
            text: '성공·실패가 한 흐름에 섞여 있어, 장애 1회가 연동 파이프라인 전체를 지연시켰습니다.',
          },
          {
            text: '폴링 주기에 묶여 있어, 사용자가 상품을 수정해도 자사몰에는 다음 주기가 되어야 반영됐습니다.',
          },
          {
            text: '큐로 옮기자 새로운 문제가 생겼습니다. 작업 전체가 메시지 1건이라 처리가 길어지면 브로커가 컨슈머를 죽은 것으로 보고 메시지를 회수해 다시 배달했고, 그때마다 재시도 횟수까지 초기화돼 3회 제한에 닿지 않는 무한 재시도가 됐습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '구조 전환 — 이벤트 기반 연동으로 전환',
            sub: [
              '상품 데이터가 운영 DB에 적재되면 그 데이터를 그대로 RabbitMQ에 발행하고, 연동 컨슈머가 받아 자사몰로 보내는 비동기 구조로 전환했습니다. 실시간 연동과 새벽 배치 두 트리거를 뒀습니다.',
            ],
          },
          {
            text: '메시지 설계 — 데이터가 아니라 작업 지시만 담기',
            sub: [
              '메시지에 데이터 전체를 담으면 재시도 시점엔 값이 낡아 오래된 값이 덮어써질 수 있어, 이력번호·대상일자 같은 "무엇을 할지"만 담고(약 100B) 컨슈머가 처리 시점에 DB를 다시 읽게 했습니다.',
              '외부 API는 한 번에 500건까지만 받아, 메시지 1건이 500건씩 N회 호출로 펼쳐집니다.',
            ],
          },
          {
            text: '실패 격리 — 재시도 후 DLQ 이관',
            sub: [
              '전송 실패 시 자동으로 재시도하고, 재시도 횟수를 초과한 건은 Dead Letter Queue로 격리해 유실 없이 사후 재처리할 수 있도록 했습니다.',
            ],
          },
          {
            text: '무한 재시도 차단 — 청크 < 처리 예산 < 배달 확인, 3중 타임아웃',
            sub: [
              '청크(0.6~0.8초)<처리 예산(60분)<배달 확인(3시간) 순으로 예산을 겹쳐 안쪽이 항상 먼저 멈추게 했고, 재시도 단위도 메시지 대신 청크로 낮췄습니다.',
            ],
          },
          {
            text: '안정성 확보 — 멱등성 설계',
            sub: [
              'at-least-once 전달로 인한 중복 전송에 대비해 멱등 처리를 설계해, 재시도가 발생해도 중복 반영 없이 처리됩니다.',
            ],
          },
          {
            text: '안정성 확보 — 수동 재처리 지원',
            sub: [
              '최종 실패한 작업은 실패 사유를 로그로 남기고, 담당자가 화면에서 직접 재시도할 수 있도록 제공했습니다.',
            ],
          },
          {
            text: '관측성 — 이상 탐지 · 웹훅 알람',
            sub: [
              'Prometheus·Loki·Grafana로 이상 징후를 규칙 기반 판정해 웹훅 알림으로 받도록 해, 장애를 사후 로그 확인 방식에서 벗어났습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '유실되던 건을 DLQ로 보관하게 돼, 장애가 나도 데이터가 사라지지 않고 사후에 재처리할 수 있습니다.',
          },
          {
            text: '자사몰 연동 도입 전에는 담당자가 9단계를 거쳐야 했지만, 도입 이후에는 저장하고 동기화만 하면 되는 2단계로 줄었습니다 (78% 감소).',
          },
          {
            text: '직접 작업 시간: 업체별 약 1시간 → 약 10분 (83% 단축)',
          },
        ],
      },
      {
        slug: 'chunk-batch-optimization',
        title: '대량 상품 검증 성능 개선',
        category: '데이터 처리',
        status: '완료',
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java', 'JDBC Batch', 'PostgreSQL'],
        summary: [
          '행이 늘수록 처리 시간이 비례보다 훨씬 가파르게 늘어나던 대용량 검사를 청크 커밋 구조로 바꿔, 10만 행 기준 30분 34초(미완료)를 23초로 줄였습니다.',
          '중복 검사처럼 쪼개면 안 되는 부분은 전역 1회로 남기고, 행 검증만 청크마다 반복했습니다.',
          '건당 조회로 24,000회 왕복하던 구조를 묶음 조회로 바꿔 48회로 줄였습니다.',
        ],
        diagrams: [
          {
            src: '/projects/chunk-superlinear-curve.svg',
            pdfSrc: '/projects/chunk-superlinear-curve.png',
            alt: '행 수에 따른 검사 시간 그래프. 2,500행 0.83초, 5,000행 2.56초, 10,000행 8.84초로 선형 기준선보다 가파르게 증가하며, 5,000행씩 두 번 나눠 처리하면 10,000행을 5.12초에 끝낸다',
          },
          {
            src: '/projects/chunk-100k-comparison.svg',
            pdfSrc: '/projects/chunk-100k-comparison.png',
            alt: '10만 행 검사 소요 비교. 청크 방식은 23초에 완료, 통짜 호출은 30분 34초에도 미완료로 취소, 청크를 단일 트랜잭션 안에서 돌리면 26분에도 미완료로 취소',
          },
        ],
        problemPoints: [
          {
            text: '상품을 엑셀로 올리면 행마다 중복·유효성 검증을 거치는데, 검사 시간이 행 수에 비례하지 않고 훨씬 가파르게 늘었습니다.',
          },
          {
            text: '10만 행은 30분 34초가 지나도 끝나지 않아 측정을 취소해야 했습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '실행 단위 분할 — 청크 크기 실측 기반 선정',
            sub: [
              '행 수가 2배로 늘면 시간은 3배 넘게 늘어난다는 걸 실측으로 확인했습니다(2,500행 0.83초·5,000행 2.56초·10,000행 8.84초, 비례라면 3.32초여야 함). 큰 요청을 청크로 잘라 여러 번 도는 방식으로 바꾸고, 한 건이 3초 안쪽에 끝나는 5,000을 청크 크기로, 효과가 사라지지 않도록 상한은 20,000으로 뒀습니다.',
            ],
          },
          {
            text: '커밋 경계 설계 — 청크마다 커밋 — 트랜잭션 전파 고정',
            sub: [
              '검사는 같은 행을 여러 번 훑으며 판정을 갱신하는데, 한 트랜잭션 안에서는 갱신이 쌓여도 정리되지 않아 패스를 거듭할수록 훑을 양이 계속 늘어났습니다(가파른 증가의 원인). 청크마다 커밋해 쌓인 걸 정리하고, 다음 청크는 깨끗한 상태에서 스캔하게 했습니다.',
            ],
          },
          {
            text: '쪼개면 안 되는 부분 남기기 — 전역 판정은 1회, 행 검증만 반복',
            sub: [
              '중복 검사는 업로드 전체를 한 번에 봐야 해 청크 단위로 찾을 수 없어, 전역 사전검증은 1회만 남기고 행 검증만 청크마다 반복했습니다.',
              '실패한 청크가 있으면 마무리를 보류합니다.',
            ],
          },
          {
            text: '청크 상태 관리 — 중간에 끊겨도 이어서 처리',
            sub: [
              '청크마다 커밋하는 대신 전체 롤백 안전장치는 포기해, 청크 처리 상태(대기·처리중·완료·실패)를 테이블에 기록했습니다.',
              '중간에 끊겨도 재실행 시 남은 청크만 이어서 처리하고, 실패한 청크는 3회까지 자동 재시도 후 멈춥니다.',
              '선점 표시로 같은 청크를 두 실행이 동시에 처리하는 것도 막습니다.',
            ],
          },
          {
            text: '왕복 횟수 병목 해소 — 건당 조회를 묶음 조회로',
            sub: [
              '행마다 1쿼리씩 날리던 조회를 500건씩 IN 절로 묶어 한 번에 가져오도록 바꿨습니다.',
              '묶음 크기를 500으로 고정한 이유는 실행계획을 재사용하기 위해서입니다. IN 절의 파라미터 개수가 매번 달라지면 DB는 다른 SQL로 보고 계획을 새로 세우는데, 개수를 고정하면 같은 쿼리가 되어 세워둔 계획을 그대로 씁니다.',
              '다만 IN 조회는 요청한 순서대로 결과가 온다는 보장이 없어, 결과를 키 기준 맵에 담은 뒤 원래 요청 순서대로 다시 꺼내 담았습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '10만 행 검증: 30분 34초(미완료) → 23초 (98% 이상 단축)',
          },
          {
            text: 'DB 왕복 횟수: 24,000회 → 48회 (99.8% 감소)',
          },
          {
            text: '10만 행 3-way 테스트 기준 — 사전검증 10.3초 + 청크 20회 + 마무리 0.03초',
          },
          {
            text: '100만 행과 1,000만 행 부하 테스트까지 돌려, 행이 늘어도 시간이 비례 수준으로만 늘어나는 것을 확인했습니다.',
          },
        ],
      },
      {
        slug: 'excel-upload-pipeline',
        title: '대량 엑셀 업로드 메모리 최적화',
        category: '데이터 처리',
        status: '완료',
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
        summary: [
          '엑셀 파일을 통째로 여는 대신 행 단위로 읽고 1,000건씩 묶어 저장해 메모리 사용량을 줄였습니다.',
          '부분 성공을 허용하지 않는 전량 원복 정책으로 반쯤 갱신된 상태를 근본적으로 차단했습니다.',
          '검증을 반영 앞으로 옮긴 앞단 게이트로, 값 하나의 오류가 전체를 무산시키는 정책의 대가를 상쇄했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/excel-pipeline-memory.svg',
            pdfSrc: '/projects/excel-pipeline-memory.png',
            alt: '엑셀 업로드 파이프라인 5단계 — 파일 수신·저장, 행 단위 읽기, 헤더 매칭·변환, 검증, 1,000건 묶음 저장 순서로 진행된다',
          },
        ],
        problemPoints: [
          {
            text: '기존 업로드 방식은 엑셀 파일 데이터를 메모리에 통째로 올려, 행이 많아지면 OOM이 발생했습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '메모리 사용량 최소화 — 행 단위 읽기, 묶음 단위 쓰기',
            sub: [
              '이전에는 파일 전체를 한 번에 객체로 만들어 메모리에 올렸는데, 행을 하나씩 읽을 때마다 컬럼 매칭·형식 변환을 바로 처리하도록 바꾸고 저장은 1,000건씩 묶어 순서를 유지하며 진행률도 보여줍니다.',
              '다만 저장 전 전체 재검증 시점엔 파싱 결과 전체가 메모리에 모이는데, 이 부분은 앞으로 개선할 지점으로 남겨뒀습니다.',
            ],
          },
          {
            text: '청크 커밋으로 바꾸면서 잃은 원자성 보완',
            sub: [
              'OOM을 피하려면 청크마다 커밋해야 하는데, 그러면 업로드 전체를 하나의 트랜잭션으로 묶을 수 없습니다. 중간에 끊기면 일부만 반영된 상태가 남습니다.',
              '전체 롤백 대신 청크 처리 상태(대기·처리중·완료·실패)를 테이블에 기록해, 재실행하면 남은 청크부터 이어서 처리하도록 했습니다.',
              '저장 전에 타입·형식을 먼저 검증하는 앞단 게이트를 둬서, 흔한 실패 원인은 반영 단계에 들어가기 전에 그 행만 반려합니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '기존에는 5만 행에서 OOM이 발생했지만, 행 단위 처리로 바꾼 뒤에는 10만 행 업로드도 메모리 문제 없이 처리합니다.',
          },
          {
            text: '반영 결과는 실제 사용 양식 7종·49,696칸을 전수 대조하는 서식 충실도 감사로 확인했습니다.',
          },
        ],
      },
      {
        slug: 'excel-sync-automation',
        title: 'PIM/MDM 도입 효과 — 업무 프로세스 단축',
        category: '아키텍처',
        status: '완료',
        hidden: true,
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
        summary: [
          '외부 데이터를 엑셀에 정리해 자사몰·전표 두 양식으로 각각 변환·업로드하던 9단계 프로세스를, 시스템 안에서 작업 후 동기화만 누르면 되는 2단계로 줄였습니다.',
          '업무 특성상 엑셀 자체는 없앨 수 없어, 로컬 엑셀을 오가는 대신 시스템 화면 안에 편집 화면을 내장했습니다.',
          '현업 담당자들의 불편을 직접 듣고 해결 방향을 함께 구체화했고, 건당 처리 시간을 40분에서 10분으로 줄였습니다.',
        ],
        diagrams: [
          {
            src: '/projects/excel-sync-automation.svg',
            pdfSrc: '/projects/excel-sync-automation.png',
            alt: '이전에는 데이터 정제부터 엑셀 기입 후 자사몰·전표시스템 두 양식으로 각각 변환·업로드하는 9단계 수작업이었고, 이후에는 시스템에서 저장·수정 후 동기화 버튼 또는 새벽 자동 동기화만 누르면 두 시스템에 자동 반영되는 2단계로 줄었다는 비교 흐름도',
          },
        ],
        problemPoints: [
          {
            text: '외부에서 받는 데이터가 자사 양식과 맞지 않아, 담당자가 정제해 엑셀에 기입한 뒤 자사몰용·전표용 두 양식으로 각각 변환해 각각 올리는 9단계 수작업을 매번 반복했습니다.',
          },
          {
            text: '업무 특성상 엑셀 자체를 없앨 수는 없었습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '시스템 안에 편집 화면 내장 — 로컬 엑셀 왕복 제거',
            sub: [
              '엑셀 서식은 유지해야 했기 때문에, 로컬 파일을 오가는 대신 시스템 화면 안에 스프레드시트 편집 UI를 내장해 담당자가 시스템을 벗어나지 않고 작업하도록 만들었습니다.',
              '대용량 셀을 다뤄야 해서 DOM 기반 라이브러리는 성능상 채택하지 못했고, 캔버스 기반으로 렌더링하는 라이브러리를 도입했습니다.',
            ],
          },
          {
            text: '수정이력 기반 동기화 — 저장하면 이력이 쌓이고, 동기화로 반영',
            sub: [
              '작업자가 시스템 안에서 저장·수정하면 그 변경이 수정이력으로 쌓이고, 동기화 버튼을 누르거나 새벽 자동 동기화 시점에 자사몰·전표시스템 두 곳에 필요한 형식으로 각각 반영되도록 만들었습니다.',
              '사용자가 할 일은 저장(또는 수정)과 동기화, 두 단계로 줄었습니다.',
            ],
          },
          {
            text: '동시 편집 데이터 오염 방지 — 낙관적 락(버전 기반)',
            sub: [
              '여러 담당자가 같은 시트를 동시에 편집하면 값이 덮어써질 위험이 있어, 문제가 실제로 터지기 전에 락을 설계해뒀습니다.',
              '매번 락을 거는 비관적 락 대신, 충돌 빈도가 낮다고 판단해 각 레코드에 버전을 두고 저장 시점에 버전이 일치하는지 확인하는 낙관적 락을 적용했습니다.',
            ],
          },
          {
            text: '헤더 매칭 방식 전환 — 위치 기반 → 이름 기반 매칭',
            sub: [
              '시트로 데이터를 관리하다 보니 컬럼을 위치(순서)로 매칭했는데, 헤더가 추가·삭제될 때마다 뒤 컬럼들의 매칭 순서를 밀거나 당겨야 해서 정합성이 깨지는 문제가 있었습니다.',
              '헤더 테이블을 두고 이름으로 core 테이블 컬럼과 매칭하는 방식으로 바꿔, 컬럼 위치가 바뀌어도 자동으로 올바르게 매칭되도록 했습니다.',
            ],
          },
          {
            text: '현업과 함께 설계 — 사용자 인터뷰 → 해결 방향 협의 → 개발',
            sub: [
              '기존 9단계 프로세스를 실제로 반복하던 담당자들에게 어떤 지점이 불편한지 직접 듣고, 해결 방향을 제안해 협의한 뒤 개발했습니다.',
              '줄여야 할 목표가 명확했던 덕분에 기능 범위를 잡기가 수월했습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '9단계 · 건당 약 40분 → 2단계 · 건당 약 10분',
          },
          {
            text: '자사몰·전표시스템 두 곳에 각각 수작업으로 반영하던 흐름을 수정이력 기반 자동 동기화로 바꿔, 처리 시간을 75% 줄였습니다.',
          },
        ],
      },
      {
        slug: 'zero-downtime-schema-migration',
        title: '무중단 스키마 마이그레이션',
        category: '마이그레이션',
        status: '완료',
        hidden: true,
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['PostgreSQL'],
        summary: [
          '컬럼명을 한 번에 바꾸지 않고 확장→전환→수축 3단계로 나눠 무중단으로 표준화했습니다.',
          '한 매입처 저장이 다른 매입처 가격을 덮어쓰던 결함을 발견해, 저장 스코프를 상품+매입처로 교정했습니다.',
          'UNIQUE 제약과 NULL의 유일성 예외를 이용해, 기존 데이터를 일괄로 채우지 않고 무중단으로 재발을 차단했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/migration-expand-contract.svg',
            pdfSrc: '/projects/migration-expand-contract.png',
            alt: '1단계에서 새 컬럼을 추가해 옛 컬럼과 공존시키고 양쪽에 쓰기, 2단계에서 읽기를 새 컬럼으로 전환, 3단계에서 옛 컬럼을 삭제하는 확장 후 수축 마이그레이션 도해',
          },
          {
            src: '/projects/migration-scope-constraint.svg',
            pdfSrc: '/projects/migration-scope-constraint.png',
            alt: '상품 기준으로만 갱신하면 다른 매입처 가격을 덮어쓰지만 상품과 매입처 기준으로 좁히면 대상이 0 또는 1행이 된다는 비교. 아래에는 두 개의 유일성 제약과 대표를 1순위로 정의한 이유, 허용 상태를 전부 자동 또는 전부 수동 둘로 좁힌 설계',
          },
        ],
        problemPoints: [
          {
            text: '운영 중인 상품 테이블에 의미가 불명확한 컬럼명이 있었고, 매입처별로 다른 가격을 갖도록 모델을 넓히는 과정에서 한 매입처 저장이 다른 매입처 가격을 조용히 덮어쓰는 결함이 드러났습니다.',
          },
          {
            text: '오류가 아니라 화면에는 성공으로 표시됐습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '컬럼명 표준화 — 확장 → 전환 → 수축, 3단계',
            sub: [
              '이름을 한 번에 바꾸면 배포 순간 신·구 코드가 공존하는 몇 초간 한쪽이 없는 컬럼을 참조하게 됩니다.',
              '새 컬럼 추가 후 양쪽에 쓰기(①)→읽기를 새 컬럼으로 전환(②)→충분히 관찰 후 옛 컬럼 삭제(③), 3단계로 나눴고 핵심은 2단계에서 멈춰도 정상 동작한다는 것입니다.',
            ],
          },
          {
            text: '재발 방지 — 불변식을 스키마 제약으로 — NULL의 유일성 예외로 무중단 제약 추가',
            sub: [
              '저장 스코프를 상품+매입처로 교정해 대상이 항상 0 또는 1행이 되게 한 뒤, 코드 방어 대신 UNIQUE(상품,매입처)·UNIQUE(상품,순위) 제약으로 재발을 차단했습니다.',
              '순위 미지정(NULL)은 유일성 비교에서 서로 다른 값으로 취급되는 성질을 이용해, 기존 데이터를 일괄로 채우지 않고 그대로 둔 채 제약을 추가했습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '상품 기준 갱신 — 덮어쓰기 결함 → 제약으로 재발 차단',
          },
          {
            text: '컬럼명 변경은 배포 시점 참조 오류 없이, 제약 추가는 기존 데이터를 일괄로 채우지 않고 무중단으로 반영했습니다.',
          },
        ],
      },
      {
        slug: 'incident-response-data-integrity',
        title: '장애 대응 & 데이터 정합성',
        category: '안정성',
        status: '완료',
        hidden: true,
        org: '유통 상품 마스터 데이터 관리 시스템',
        techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
        summary: [
          '컬럼 위치 가정이 만든 전량 유실 사고를 헤더 이름 기반 매칭으로 바꿔 재발을 차단했습니다.',
          '검증과 저장의 타입 불일치로 앞자리 0이 사라지는 사고를 원문 그대로 문자열로 다루도록 고쳤습니다.',
          '업로드 화면과 저장 프로시저에 흩어져 있던 이중 판정을 하나로 모아 10만 행도 질의 1회로 처리하게 했습니다.',
        ],
        diagrams: [
          {
            src: '/projects/stability-position-loss.svg',
            pdfSrc: '/projects/stability-position-loss.png',
            alt: '종전에는 기준 열 왼쪽의 모든 컬럼이 삭제되어 상품코드가 유실됐고, 수정 후에는 헤더 텍스트로 매칭해 위치와 무관하게 모든 컬럼을 읽는다는 비교 도해',
          },
          {
            src: '/projects/stability-dual-judgment.svg',
            pdfSrc: '/projects/stability-dual-judgment.png',
            alt: '종전에는 업로드 화면과 저장 프로시저가 각각 다른 기준으로 등록 모드를 판정해 결론이 어긋나 24행이 반려됐고, 수정 후에는 두 곳이 같은 판정 함수를 호출해 결론이 하나로 모인다는 비교 도해',
          },
        ],
        problemPoints: [
          {
            text: '엑셀 업로드 파이프라인에 서로 다른 원인의 사고가 반복됐습니다.',
          },
          {
            text: '컬럼 위치가 바뀌면 인식하지 못해 상품코드가 유실됐고(106행×4회 반려), 검증을 통과한 값도 저장 시 형식이 바뀌어 브랜드코드 매칭이 실패했으며(1,114행), 화면과 저장 로직의 판단 기준이 달라 결론이 어긋나기도 했습니다(24행 반려).',
          },
        ],
        solutionPoints: [
          {
            text: '위치 의존성 제거 — 헤더 이름 기반 매칭',
            sub: [
              '기준 열 왼쪽을 통째로 삭제하던 로직에서 컬럼 순서가 재정의되며 기준 열이 밀려 상품코드까지 삭제됐습니다(106행×4회 반려). 열 채택 기준을 "헤더 텍스트가 정의와 일치하는가" 하나로 바꿔 위치와 무관하게 읽도록 했습니다.',
            ],
          },
          {
            text: '쓰기 단계 타입 안전성 — 앞자리 0 보존',
            sub: [
              '브랜드코드 002079처럼 형식 검증은 통과하지만 저장 시 수치형 변환으로 앞자리 0이 사라져 매칭이 실패했습니다(1,114행). 검증·저장이 같은 정의를 보지 않은 게 원인이라, 자리 표기 값은 끝까지 문자열로 다루도록 고쳤습니다.',
            ],
          },
          {
            text: '판정 로직 일원화 — 이중 판정 통합',
            sub: [
              '업로드 화면과 저장 프로시저가 등록 여부를 각자 다른 기준으로 판정해 결론이 어긋나 24행이 원인 불명으로 반려됐습니다.',
              '판정 함수를 하나로 모으고, 행 단위 조회 대신 집합 질의 1회로 대조해 10만 행이어도 질의 1회로 끝나게 했습니다.',
            ],
          },
          {
            text: '재발 방지 — 판정 기준을 위치에서 이름으로',
            sub: [
              '"컬럼이 몇 개 연속으로 맞으면 검사 대상"이라는 위치 규칙은 3개와 4개를 가르는 근거가 없어, 기준을 "이름이 정의에 있는가"로 바꿔 임계값을 없앴습니다.',
              '누락은 반려·정의 밖은 확인 요청·중복은 자동 선택, 세 갈래로 정리했습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '유실·반려 반복 → 불일치 0건',
          },
          {
            text: '서식 충실도 감사 — 실제 양식 7종·49,696칸 전수 대조 결과 기준. 데이터 오류로 인한 반려·재작업을 줄여, 담당 부서의 반복 확인 업무 부담을 덜었습니다.',
          },
        ],
      },
      ] as PortfolioProject[],
    },
    {
      name: '정산어택',
      kind: '사이드 프로젝트',
      projects: [
      {
        slug: 'pr-review-pipeline',
        title: 'LLM PR 리뷰 자동화 파이프라인',
        category: '아키텍처',
        status: '완료',
        org: '개인 사이드 프로젝트',
        techStack: ['n8n', 'Kafka', 'Ollama', 'Gemini API', 'GitHub API'],
        summary: [
          '사내에 PR 리뷰 절차가 없어, 도입을 제안하기 전에 개인 저장소에 먼저 적용해 검증할 목적으로 만들었습니다.',
          '로컬 모델(Qwen)이 리뷰 후보를 추리고 Gemini가 최종 판정하는 2단 구조로, 무료 API 한도와 비용 부담을 분산했습니다.',
          'GitHub Webhook을 직접 받지 않고 Kafka를 거치게 해, 파이프라인이 꺼져 있던 동안 들어온 PR 이벤트도 유실 없이 이어서 처리합니다.',
        ],
        diagrams: [
          {
            src: '/projects/pr-review-n8n-flow.png',
            pdfSrc: '/projects/pr-review-n8n-flow.png',
            alt: 'Kafka Trigger로 시작해 Switch, PR 메타데이터 정규화, GitHub PR 파일 조회, 리뷰 컨텍스트 선택, 프로젝트 문서 읽기와 텍스트 추출, 후보 프롬프트 생성, 로컬 Ollama 후보 탐색, 응답 파싱, Gemini 프롬프트 생성과 리뷰 호출, 결과 파싱, GitHub PR 댓글 작성, Slack 학습 가이드 전송까지 15개 노드로 이어지는 실제 n8n 워크플로 화면',
          },
          {
            src: '/projects/pr-review-pipeline.svg',
            pdfSrc: '/projects/pr-review-pipeline.png',
            alt: 'GitHub PR 이벤트가 Kafka 토픽에 쌓이고 n8n이 컨슈머로 가져와 PR 메타데이터를 정규화한 뒤, PR 번호로 GitHub에서 diff를 조회하고 변경 영역에 맞는 설계 문서를 골라 읽는다. 이후 로컬 Qwen 모델이 리뷰 후보를 추리고 Gemini가 최종 판정해 GitHub PR 댓글과 Slack 학습 가이드로 전송하는 파이프라인 구성도',
          },
        ],
        problemPoints: [
          {
            text: '사내에 Git은 쓰지만 PR 리뷰 문화가 없어, 코드가 아무 검토 없이 머지됐습니다. 기존 작업 방식이 빠르게 개발하는 쪽에 치우쳐 있어, 리뷰 단계를 새로 끼워 넣기 어려운 상황이었습니다.',
          },
          {
            text: 'AI가 1차로 PR을 훑어주면 사람 부담 없이 리뷰를 시작할 수 있겠다고 보고, 직접 만들어 사내 도입을 제안하기로 했습니다.',
          },
          {
            text: '그렇다고 LLM에 diff만 던지면 네이밍·널 체크 같은 일반론만 쏟아내기 때문에, 프로젝트의 설계 규칙을 읽고 판단하게 만드는 게 과제였습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '설계 한눈에 보기 — 수집과 리뷰, 두 단계로 나눈 구조',
            sub: [
              'AI가 PR을 1차로 훑어주면 리뷰에 드는 시간을 크게 줄일 수 있겠다고 보고 시작했습니다.',
              '노드 하나하나보다 어떤 판단을 했는지가 중요해, 파이프라인을 수집 단계와 2단 리뷰 단계로 나눠 정리하면 이렇습니다.',
              '각 결정의 이유는 아래에 이어집니다.',
            ],
          },
          {
            text: '이벤트 유실 방지 — Webhook 직결 대신 Kafka 경유 — 성공했을 때만 offset 처리',
            sub: [
              'GitHub Webhook을 n8n이 직접 받으면 n8n이 내려가 있는 동안 들어온 PR 이벤트가 사라집니다.',
              '이벤트를 먼저 Kafka 토픽에 쌓고 n8n이 컨슈머로 가져가도록 했고, offset은 워크플로가 성공한 시점에만 처리하도록 설정해 중간에 실패한 이벤트가 유실되지 않게 했습니다.',
            ],
          },
          {
            text: '메시지에는 PR 번호만 — diff는 처리 시점에 다시 조회',
            sub: [
              'Kafka 메시지에 diff 전체를 싣지 않고 저장소·PR 번호·커밋 해시만 담았습니다.',
              '컨슈머가 처리 시점에 GitHub API로 최신 변경 파일을 다시 읽기 때문에, 재처리가 늦어져도 낡은 diff로 리뷰하는 일이 없습니다.',
              '회사에서 RabbitMQ 연동을 설계할 때 "메시지에 데이터가 아니라 작업 지시만 담는다"로 풀었던 문제와 같은 구조입니다.',
            ],
          },
          {
            text: '변경 영역에 따라 읽을 설계 문서를 선택 — 전체 문서를 매번 넣지 않기',
            sub: [
              '프로젝트 문서를 전부 프롬프트에 넣으면 토큰 비용이 커지고 정작 중요한 규칙이 묻힙니다.',
              '기본 정책 문서는 항상 포함하되, PR이 건드린 경로(코어·서버·DB 변경 이력)에 따라 관련 설계 문서를 골라 읽도록 했습니다.',
            ],
          },
          {
            text: '2단 모델 — 로컬이 추리고, Gemini가 판정 — 로컬 후보 탐색 → 클라우드 최종 검증',
            sub: [
              '로컬 Ollama(qwen2.5-coder:14b)가 먼저 diff를 훑어 다시 볼 만한 후보를 찾고, Gemini가 그 후보와 실제 diff·정책을 함께 보고 최종 리뷰를 작성합니다.',
              '무료 API 한도와 비용 때문에 택한 구조인데, 로컬 모델의 오판이 그대로 통과하지 않도록 프롬프트에 "후보는 참고자료일 뿐이니 diff를 다시 검증하라"고 명시했습니다.',
            ],
          },
          {
            text: '실패 처리를 단계마다 다르게 — 참고용은 계속 진행, 전송물은 fail-fast',
            sub: [
              '로컬 모델 응답은 참고자료라 JSON 파싱에 실패해도 오류 상태만 표시하고 파이프라인을 계속 진행합니다.',
              '반면 Gemini 결과는 실제로 GitHub 댓글과 Slack에 나가는 내용이라, 응답 잘림·빈 본문·필수 필드 누락을 모두 검사해 하나라도 어긋나면 전송하지 않고 중단합니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '사내 도입을 제안했지만, 회의 결과 당장의 우선순위는 아니라는 쪽으로 의견이 모여 채택되지 않았습니다.',
          },
          {
            text: '하지만 개인 저장소 PR에 적용해 운영 중이고, 개인 PR 리뷰 스터디에도 활용하고 있습니다.',
          },
        ],
      },
      {
        slug: 'jeongsan-attack',
        title: '정산어택',
        category: '사이드 프로젝트',
        status: '진행 중',
        org: '개인 사이드 프로젝트',
        techStack: ['Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'Liquibase', 'Kotest'],
        summary: [
          '차수마다 참석자와 음주 여부가 달라 총무 혼자 계산하기 어려운 문제에서 출발해, 참여자가 직접 조건을 입력하고 계산 근거까지 함께 보는 구조로 기획했습니다.',
          '정산 계산을 DB·웹 계층에서 떼어낸 순수 core 모듈로 구현하고, 금액을 유리수로 다뤄 나눗셈 오차가 합계를 어긋나게 하지 않도록 했습니다.',
          '고정 시드로 만든 입력에 대해 합계 일치·음수 금액 여부·동일 입력의 동일 결과를 Kotest로 검사합니다.',
        ],
        problemPoints: [
          {
            text: '모임을 하면서 총무가 계산을 힘들어하는 걸 보고 시작했습니다. 단순한 N분의 1이면 문제가 없는데, 술자리는 그렇지 않았습니다.',
          },
          {
            text: '누구는 술을 마시고 누구는 안 마시고, 1차만 오거나 2차부터 합류하기도 합니다. 차수마다 참석자와 먹은 항목이 달라지니 N분의 1로는 금액이 맞지 않았습니다.',
          },
          {
            text: '그 계산을 전부 총무 혼자 수기로 떠안고 있어서, 그 부담을 덜어주고 싶었습니다.',
          },
          {
            text: '게다가 돈 계산이라 한 번만 틀려도 신뢰를 잃기 때문에, 계산이 맞다는 것을 스스로 증명할 수 있어야 했습니다.',
          },
        ],
        solutionPoints: [
          {
            text: '계산을 떼어내기 — 순수 core 모듈로 분리',
            sub: [
              '정산 계산을 DB·웹 계층에서 분리해 외부 의존이 없는 core 모듈로 만들었습니다.',
              '입력과 출력만 있는 구조라 테스트를 돌리는 데 DB도 서버도 필요 없고, 계산 규칙이 바뀌어도 영향 범위가 모듈 안에서 끝납니다.',
              '입력 검증도 이 안에서 처리하고, 성공·실패는 예외 대신 명시적인 결과 타입으로 돌려줘 호출하는 쪽이 실패 처리를 빠뜨릴 수 없게 했습니다.',
            ],
          },
          {
            text: '금액 오차 없애기 — 유리수 기반 금액 연산',
            sub: [
              '한 금액을 3명이 나누는 계산을 소수로 처리하면 끝자리가 딱 떨어지지 않아 각자 몫의 합이 원금과 어긋납니다.',
              '금액을 유리수(분수)로 다뤄 나눗셈을 정확하게 유지하고 마지막 단계에서만 반올림하도록 했습니다.',
              '정산은 1원만 안 맞아도 신뢰를 잃는 영역이라 이 부분을 먼저 고정했습니다.',
            ],
          },
          {
            text: '계산이 맞다는 것을 테스트로 고정 — Kotest · 고정 시드 입력 검사',
            sub: [
              '고정 시드로 입력을 생성해 세 가지를 검사합니다 — 각자 몫의 합이 원금과 일치하는가, 음수 금액이 나오지 않는가, 같은 입력이 항상 같은 결과를 내는가. 케이스를 손으로 나열하는 대신 결과가 지켜야 할 성질을 검사하는 방식이라, 예상하지 못한 조합에서도 깨지는지 확인할 수 있습니다.',
            ],
          },
          {
            text: '인증과 스키마 관리 — 카카오 로그인 · httpOnly JWT · Liquibase',
            sub: [
              '카카오 로그인으로 가입 절차를 없애고, 인증 토큰은 httpOnly 쿠키로 내려 브라우저 스크립트에서 토큰을 읽을 수 없게 했습니다.',
              '스키마 변경은 Liquibase changelog로 관리해 변경 이력이 코드와 함께 남도록 했습니다.',
            ],
          },
        ],
        resultPoints: [
          {
            text: '정산 계산 모듈과 인증을 구현해 현재 배포를 준비하고 있습니다.',
          },
        ],
      },
      ] as PortfolioProject[],
    },
  ],
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
