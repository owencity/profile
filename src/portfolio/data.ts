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
  kind: '회사 프로젝트' | '사이드 프로젝트'
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
    '사용자 관점에서 생각하고, 문제의 본질을 해결하려는 백엔드 개발자 김동규입니다.',
    '현재 유통사 인하우스 개발팀에서 상품관리 백오피스 시스템을 개발하고 있습니다.',
    '현업 사용자와 가까운 환경에서 일하며, 사용자가 겪는 불편과 반복 업무를 직접 듣고 문제의 원인을 파악합니다. 전달받은 요구사항을 그대로 구현하기보다 문제의 본질이 무엇인지, 왜 발생하는지, 더 나은 해결 방법은 없는지를 고민하고 사용자와 함께 해결 방법을 구체화하여 개발합니다.',
    '이를 위해 도메인과 업무 프로세스를 이해하고, 필요한 기능과 개선 방향을 직접 제안하며 실제 업무의 문제를 해결하는 개발을 지향합니다.',
    '또한 기능 구현에만 머무르지 않고 트래픽, 데이터 정합성, 동시성, 성능과 같은 백엔드 아키텍처 관점의 문제에도 관심을 가지고, 안정적인 시스템을 만들기 위한 해결 방법을 고민하고 있습니다.',
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
    degree: '컴퓨터공학 학사 (학점은행제 · 국가평생교육진흥원)',
    degreePeriod: '2027.03 졸업 예정',
    priorSchool: '서영대학교 보건행정과',
    priorSchoolPeriod: '2017.02 ~ 2019.02 졸업',
    bootcamp: '백엔드 자바 부트캠프 · 2024.01 ~ 2024.06',
    certificates: ['정보처리기사 · 2024.12'],
  },
  skills: {
    backend: ['Java', 'Spring Boot', 'JPA', 'PostgreSQL', 'MySQL', 'RabbitMQ'],
    tools: ['AWS', 'Docker', 'Git', 'OCI', 'Prometheus', 'Loki', 'Grafana'],
  },
  projectGroups: [{
    name: '상품관리 시스템 고도화',
    kind: '회사 프로젝트',
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
        'Seasar2 SSR 구조를 React+Spring Boot로 분리하며, AI 코드 변환 지원으로 프레임워크 전환보다 기능 검수에 더 많은 시간을 썼습니다.',
        'MySQL 5→PostgreSQL 전환에서 pgloader로 옮긴 뒤 타입·SQL 문법 차이를 하나씩 교정했습니다.',
        '3개월 분석 후 작은 기능부터 검증하며 전환을 진행해 2개월 만에 1차 개발을 완료, 신규 기능 개발 기간을 1주일에서 2~3일로 줄였습니다.',
      ],
      diagram: {
        src: '/projects/legacy-infra-architecture.svg',
        pdfSrc: '/projects/legacy-infra-architecture.png',
        alt: '종전에는 JSP와 Seasar2가 MySQL 5를 거쳐 VMware 온프레미스 환경에 수동으로 배포됐고, 이후에는 Git과 Jenkins를 거쳐 Staging(dev)에서 먼저 검증한 뒤 IDC 온프레미스 서버(Prod)에 자동 빌드·배포되며, React와 Spring Boot가 PostgreSQL과 통신하고 Spring Boot가 RabbitMQ를 거쳐 자사몰 API와 연동하는 인프라 구성 비교도',
        caption:
          '개발부터 배포까지 Git·Jenkins로 자동화하고, 클라이언트 요청 흐름과 외부 연동(RabbitMQ)을 분리했습니다. 인프라는 그대로 온프레미스(VMware→IDC)를 유지하면서, 수동 배포 대신 Git→Staging(dev) 검증→Prod(IDC 서버) 순으로 넘어가는 자동 빌드·배포 파이프라인으로 바꿨습니다.',
      },
      problem:
        '입사 3개월 차에 인계받은 노후 소스코드(Java 1.6·Seasar2·MySQL 5)로 신규 기능을 추가할 때마다 프레임워크 한계에 부딪혀, 직접 마이그레이션을 제안·PoC 검증 후 전환을 주도했습니다. 기존과 동일하게 동작해야 한다는 제약 속에서 기능 하나 놓치지 않고 React+Spring Boot로 옮기는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '프레임워크 전환 — SSR에서 React + Spring Boot로',
          items: [
            {
              label: 'AI 보조 코드 변환 + 꼼꼼한 기능 검수',
              desc: 'Seasar2 SSR 구조를 React+Spring Boot로 분리하는 전환으로, 프레임워크 코드 변환 자체는 AI 도구 지원으로 수월했지만 기존과 동일하게 동작해야 해 기능 하나하나 검수·교정하는 데 가장 많은 시간을 썼습니다.',
            },
          ],
        },
        {
          title: 'DB 전환 — MySQL 5 → PostgreSQL',
          items: [
            {
              label: 'pgloader 변환 후 타입·SQL 수동 교정',
              desc: 'pgloader로 1차 변환 후 두 DB의 타입 불일치를 하나씩 교정했습니다. 예를 들어 MySQL은 GROUP BY에 없는 컬럼도 느슨하게 허용하지만 PostgreSQL은 엄격히 막아, 관련 쿼리를 전부 표준에 맞게 고쳤습니다.',
            },
          ],
        },
        {
          title: '전환 전략 — 분석 → 소규모 검증 → 실행',
          items: [
            {
              label: '3개월 분석 후 작은 기능으로 먼저 검증',
              desc: '3개월간 코드를 분석해 시스템 흐름을 익히고, 작은 기능 하나로 실현 가능성을 검증한 뒤 전환을 진행했습니다. 1차 개발 완료까지 약 2개월이 걸렸습니다.',
            },
          ],
        },
        {
          title: '배포 자동화',
          items: [
            {
              label: 'Jenkins · Docker 도입',
              desc: '빌드·배포를 셸 스크립트+Docker로 정리해 Jenkins가 Staging(dev) 검증 후 Prod(IDC 서버)로 넘기는 파이프라인을 구성했습니다. 수동 배포가 자동화되며 소요 시간이 20분에서 5분으로 줄었습니다.',
            },
          ],
        },
      ],
      result: {
        before: '신규 기능 개발 1주일',
        after: '2~3일',
        note: '배포도 Jenkins·Docker 도입으로 20분→5분으로 줄었습니다(실무 중 직접 확인한 수치). 기능을 더 빠르게 반영하면서 담당 부서의 업무 요청 처리 속도도 함께 빨라졌습니다.',
      },
    },
    {
      slug: 'postgresql-vs-mysql-benchmark',
      title: 'PostgreSQL vs MySQL 실측 비교',
      category: '마이그레이션',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['PostgreSQL', 'MySQL', 'sysbench', 'Python'],
      summary: [
        '"PostgreSQL이 다 낫다"는 통념을 그대로 받아들이지 않고, 5가지 가설을 세워 동일 리소스·동일 데이터로 직접 측정했습니다.',
        '측정 도중 드라이버 비대칭으로 수치가 부풀려진 걸 스스로 발견해, 양쪽을 네이티브 C 드라이버로 맞추고 재측정했습니다.',
        '복잡한 조인·분석은 PostgreSQL이 최대 69배 빨랐고, 동시 재고차감 정합성 테스트에서 MySQL만 257건의 과다판매가 발생해 이를 결정적 근거로 PostgreSQL을 선택했습니다.',
      ],
      diagram: {
        src: '/projects/db-benchmark-infra.svg',
        pdfSrc: '/projects/db-benchmark-infra.png',
        alt: '로컬 Docker 환경에서 PostgreSQL 16과 MySQL 8.4를 버퍼 1.5GB로 개발·반복하지만 자원을 공유해 검증력이 약하고, 동일 compose에 OCI 오버라이드를 적용해 OCI 4vCPU·24GB 전용 환경(버퍼 6GB)에서 같은 사양으로 한 번 더 측정한다. GitHub Actions가 workflow_dispatch로 SSH·rsync를 통해 OCI에서 run_all.sh를 실행시키고 결과를 아티팩트로 회수하는 구성도',
        caption:
          '로컬 Docker에서 먼저 빠르게 반복 검증했지만, 로컬 환경은 다른 프로세스와 자원을 공유해 측정 검증력이 약합니다. 그래서 GitHub Actions로 OCI 전용 서버를 원격 트리거해 같은 사양으로 한 번 더 측정해 신뢰할 수 있는 최종 수치를 확보했습니다. 로컬과 OCI는 같은 compose에 버퍼 크기만 오버라이드해 구성 차이로 인한 왜곡도 막았습니다.',
      },
      problem:
        'MySQL 5→PostgreSQL 전환에 앞서 "PostgreSQL이 더 낫다"는 업계 통념을 그대로 받아들이지 않고 실제 워크로드로 직접 검증하는 게 과제였습니다. 검증할 가설 5개(단순 작업·대규모 JOIN·대규모 분석·동시 쓰기·정합성)를 세우고, 동일 리소스(OCI 4vCPU·24GB)와 동일 데이터(주문 최대 607만 건)로 두 엔진을 공정하게 비교했습니다.',
      solutionGroups: [
        {
          title: '종합 결과 먼저',
          items: [
            {
              label: '5개 항목 배율 요약',
              desc: '5가지 가설을 실측한 결과를 배율로 정리하면 이렇습니다. 항목별 측정 방법과 수치는 아래에 이어집니다.',
              diagram: {
                src: '/projects/db-benchmark-summary.svg',
                pdfSrc: '/projects/db-benchmark-summary.png',
                alt: '단순 조회 1.65배, 동시 쓰기 1.22배, insert 3.88배, 대규모 JOIN 4.73배, 대규모 분석 68.6배로 항목별 PostgreSQL 우위 배율을 로그 스케일로 정리한 막대 그래프',
                caption:
                  '5개 항목 모두 PostgreSQL이 뒤지지 않았지만 격차 크기는 워크로드마다 크게 달랐습니다. 조인·분석처럼 복잡한 쿼리일수록 격차가 컸고, 단순 조회·동시 쓰기는 격차가 작았습니다.',
              },
            },
          ],
        },
        {
          title: '① 단순 OLTP — 처리량은 PostgreSQL, 꼬리 지연은 MySQL',
          items: [
            {
              label: 'sysbench 4종 측정',
              desc: 'point_select·insert·읽기/쓰기 4가지 워크로드 모두 평균 처리량은 PostgreSQL이 앞섰지만(최대 3.88배), 가장 오래 걸린 insert 요청은 MySQL 44ms·PostgreSQL 268ms로 PostgreSQL이 간헐적으로 크게 느려지는 구간이 있어 단정하지 않았습니다.',
              diagram: {
                src: '/projects/db-benchmark-oltp.svg',
                pdfSrc: '/projects/db-benchmark-oltp.png',
                alt: 'sysbench 4종 워크로드(point_select, insert, read_only, read_write) 처리량 비교. 모든 항목에서 PostgreSQL이 MySQL보다 높지만 격차는 항목마다 다르다',
                caption:
                  '처리량은 4개 항목 모두 PostgreSQL 우위였지만, 격차 폭은 point_select(1.65배)부터 insert(3.88배)까지 제각각이었습니다.',
              },
            },
          ],
        },
        {
          title: '② 대규모 JOIN — 7개 테이블 조인',
          items: [
            {
              label: 'Parallel Hash Join vs Nested Loop',
              desc: 'PostgreSQL은 병렬 해시 조인을, MySQL은 행마다 PK를 조회하는 중첩 루프를 택해 데이터가 커질수록 격차가 벌어졌습니다(200만 행 4.0배 → 607만 행 4.7배).',
              diagram: {
                src: '/projects/db-benchmark-join.svg',
                pdfSrc: '/projects/db-benchmark-join.png',
                alt: '7개 테이블 조인 실행시간 비교. 주문 200만 행에서 MySQL 23.5초 대 PostgreSQL 5.8초로 4.0배, 주문 607만 행에서 MySQL 85.5초 대 PostgreSQL 18.1초로 4.7배 격차',
                caption:
                  'PostgreSQL은 병렬 워커 4개로 해시 조인을 처리하고, MySQL은 단일 스레드 중첩 루프로 처리해 데이터가 커질수록 격차가 확대됩니다.',
              },
            },
          ],
        },
        {
          title: '③ 대규모 분석 쿼리',
          items: [
            {
              label: '집계·정렬 4종 쿼리',
              desc: '월별 집계·상품 누적·고객 상위·입출고 이력 4개 쿼리 모두 PostgreSQL이 병렬 워커로 처리한 반면 MySQL은 단일 스레드로 동작해, 가장 큰 테이블(1,300만 행) 기준 69배까지 격차가 벌어졌습니다.',
              diagram: {
                src: '/projects/db-benchmark-analytics.svg',
                pdfSrc: '/projects/db-benchmark-analytics.png',
                alt: '집계·정렬 중심 분석 쿼리 4종의 실행시간 비교(log 스케일). 월별집계 7배, 상품누적 38배, 고객상위 21배, 최대 테이블(1300만 행) 입출고 이력 69배로 PostgreSQL이 빠르다',
                caption:
                  '대상 테이블이 클수록 병렬 처리 유무의 격차가 커져, 1,300만 행 쿼리에서는 69배까지 벌어졌습니다.',
              },
            },
          ],
        },
        {
          title: '측정 오염 직접 발견 → 재측정 (④ MVCC 동시 쓰기)',
          items: [
            {
              label: '드라이버 비대칭 적발',
              desc: '동시 쓰기 테스트에서 PostgreSQL이 1.44배 빠르다는 결과가 나와 "MVCC라 빠르다"고 결론 내리기 직전, PostgreSQL엔 C 확장 드라이버(psycopg2)를, MySQL엔 순수 Python 드라이버를 쓰고 있었다는 걸 발견했습니다. MySQL도 네이티브 C 드라이버로 맞춰 재측정하니 격차가 1.44배→1.22배로 줄었습니다.',
              diagram: {
                src: '/projects/db-benchmark-mvcc.svg',
                pdfSrc: '/projects/db-benchmark-mvcc.png',
                alt: '동시 쓰기 처리량(commits/sec) 비교. 드라이버가 비대칭이던 오염 측정에서는 MySQL 839 대 PostgreSQL 1,210으로 1.44배 격차였으나, 양쪽 모두 네이티브 C 드라이버로 공정화한 뒤에는 MySQL 946 대 PostgreSQL 1,150으로 1.22배로 줄었다',
                caption:
                  '그럴듯한 결론("MVCC라 빠르다")을 그대로 적지 않고, 오염된 수치를 폐기한 뒤 재측정해서 실제 격차를 확인했습니다.',
              },
            },
          ],
        },
        {
          title: '⑤ 정합성 — 동시 재고차감 (결정적 근거)',
          items: [
            {
              label: 'MySQL 과다판매 257건 vs PostgreSQL 0건',
              desc: '같은 상품 재고에 여러 커넥션이 동시에 차감을 요청하는 상황을 동일한 REPEATABLE READ 조건에서 재현했습니다. MySQL은 257건의 과다판매(lost update)가 발생했지만, PostgreSQL은 직렬화 오류로 거부하고 재시도를 유도해 0건이었습니다. 조인·분석 성능도 PostgreSQL이 우위였지만, 재고·주문 도메인에서는 이 정합성 결과가 선택을 확정지었습니다.',
              diagram: {
                src: '/projects/db-benchmark-lost-update.svg',
                pdfSrc: '/projects/db-benchmark-lost-update.png',
                alt: '동일 REPEATABLE READ 조건에서 동시 재고차감을 반복했을 때 MySQL은 257건의 과다판매가 발생했고 PostgreSQL은 0건이었다는 막대 비교',
                caption:
                  '동일 REPEATABLE READ 조건에서 동시 차감을 반복한 결과입니다. PostgreSQL은 직렬화 오류로 거부한 뒤 재시도를 유도해 과다판매를 원천 차단했습니다.',
              },
            },
          ],
        },
      ],
      result: {
        note: '복잡 조인은 4.7배, 대규모 분석은 최대 69배 PostgreSQL이 빨랐고, 단순 조회의 지연시간만 MySQL이 더 안정적이었습니다. 배율이 아니라 이 정합성 결과가 최종 선택을 갈랐습니다.',
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
        '상품관리시스템과 자사몰 API 간 연동을 스케줄러 폴링 방식으로 개발했는데, 자사몰 장애 시 실패 건이 유실되고 수동 복구가 필요해 장애 1회가 파이프라인 전체를 지연시켰습니다. 실패를 잃지 않는 비동기 아키텍처로 다시 설계하는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '구조 전환',
          items: [
            {
              label: '이벤트 기반 연동으로 전환',
              desc: '상품 데이터가 upsert되면 등록·수정 이력을 기준으로 자사몰 반영 대상을 판별하고, 실시간 연동과 새벽 배치 두 트리거로 RabbitMQ에 발행하는 비동기 구조로 전환했습니다.',
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
              desc: '메시지에 데이터 전체를 담으면 재시도 시점엔 값이 낡아 오래된 값이 덮어써질 수 있어, 이력번호·대상일자 같은 "무엇을 할지"만 담고(약 100B) 컨슈머가 처리 시점에 DB를 다시 읽게 했습니다. 외부 API는 한 번에 100건까지만 받아, 메시지 1건이 100건씩 N회 호출로 펼쳐집니다.',
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
              desc: '컨슈머가 메시지를 오래 붙잡으면 브로커가 죽었다고 판단해 회수·재배달하는데, 이러면 재시도 횟수도 초기화돼 3회 제한에 닿지 않는 무한 재시도가 됩니다. 청크(0.6~0.8초)<처리 예산(60분)<배달 확인(3시간) 순으로 예산을 겹쳐 안쪽이 항상 먼저 멈추게 했고, 재시도 단위도 메시지 대신 청크로 낮췄습니다.',
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
              desc: 'at-least-once 전달로 인한 중복 전송에 대비해 멱등 처리를 설계해, 재시도가 발생해도 중복 반영 없이 처리됩니다.',
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
              desc: 'Prometheus·Loki·Grafana로 이상 징후를 규칙 기반 판정해 웹훅 알림으로 받도록 해, 장애를 사후 로그 확인 방식에서 벗어났습니다.',
            },
          ],
        },
      ],
      result: {
        note: '장애 1회로 전체가 지연되던 구조에서 실패 격리·자동 재시도·알람까지 갖춘 구조로 전환했습니다. 자사몰 상품 정보가 실시간 연동되며 고객이 보는 가격·상품 정보의 최신성도 좋아졌습니다.',
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
        '상품 데이터를 엑셀로 업로드하면 행마다 중복·유효성 검증을 거치는데, 검사 시간이 행 수에 비례하지 않고 훨씬 가파르게 늘어나 10만 행 업로드는 30분 34초가 지나도 끝나지 않아 측정을 취소해야 했습니다. 검사 로직은 그대로 두고 실행 구조만 바꿔 현실적인 시간 안에 끝내는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '실행 단위 분할',
          items: [
            {
              label: '청크 크기 실측 기반 선정',
              desc: '행 수가 2배로 늘면 시간은 3배 넘게 늘어난다는 걸 실측으로 확인했습니다(2,500행 0.83초·5,000행 2.56초·10,000행 8.84초, 비례라면 3.32초여야 함). 큰 요청을 청크로 잘라 여러 번 도는 방식으로 바꾸고, 한 건이 3초 안쪽에 끝나는 5,000을 청크 크기로, 효과가 사라지지 않도록 상한은 20,000으로 뒀습니다.',
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
              desc: '검사는 같은 행을 여러 번 훑으며 판정을 갱신하는데, 한 트랜잭션 안에서는 갱신이 쌓여도 정리되지 않아 패스를 거듭할수록 훑을 양이 계속 늘어났습니다(가파른 증가의 원인). 청크마다 커밋해 쌓인 걸 정리하고, 다음 청크는 깨끗한 상태에서 스캔하게 했습니다.',
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
              desc: '중복 검사는 업로드 전체를 한 번에 봐야 해 청크 단위로 찾을 수 없어, 전역 사전검증은 1회만 남기고 행 검증만 청크마다 반복했습니다. 실패한 청크가 있으면 마무리를 보류합니다.',
            },
          ],
        },
        {
          title: '청크 상태 관리',
          items: [
            {
              label: '중간에 끊겨도 이어서 처리',
              desc: '청크마다 커밋하는 대신 전체 롤백 안전장치는 포기해, 청크 처리 상태(대기·처리중·완료·실패)를 테이블에 기록했습니다. 중간에 끊겨도 재실행 시 남은 청크만 이어서 처리하고, 실패한 청크는 3회까지 자동 재시도 후 멈춥니다. 선점 표시로 같은 청크를 두 실행이 동시에 처리하는 것도 막습니다.',
            },
          ],
        },
        {
          title: '왕복 횟수 병목 해소',
          items: [
            {
              label: '건당 조회를 묶음 조회로',
              desc: '건당 1쿼리로 24,000회 왕복하던 걸 500건씩 묶어 조회해 48회로 줄였습니다. 묶음 크기는 고정했는데(실행계획 재사용을 위해), 결과 순서가 보장되지 않아 키로 맵을 만들어 원래 순서대로 다시 담았습니다.',
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
        '엑셀 파일을 통째로 여는 대신 행 단위로 읽고 1,000건씩 묶어 저장해 메모리 사용량을 줄였습니다.',
        '부분 성공을 허용하지 않는 전량 원복 정책으로 반쯤 갱신된 상태를 근본적으로 차단했습니다.',
        '검증을 반영 앞으로 옮긴 앞단 게이트로, 값 하나의 오류가 전체를 무산시키는 정책의 대가를 상쇄했습니다.',
      ],
      problem:
        '대량의 상품 데이터를 엑셀로 업로드할 때, 파일을 통째로 메모리에 올려 처리해 행이 많을수록 메모리를 많이 썼고 중간에 일부만 저장된 채 실패하면 재실행도 위험했습니다. 메모리를 적게 쓰면서도 실패 시 안전하게 되돌릴 수 있는 파이프라인을 만드는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '메모리 사용량 최소화',
          items: [
            {
              label: '행 단위 읽기, 묶음 단위 쓰기',
              desc: '이전에는 파일 전체를 한 번에 객체로 만들어 메모리에 올렸는데, 행을 하나씩 읽을 때마다 컬럼 매칭·형식 변환을 바로 처리하도록 바꾸고 저장은 1,000건씩 묶어 순서를 유지하며 진행률도 보여줍니다. 다만 저장 전 전체 재검증 시점엔 파싱 결과 전체가 메모리에 모이는데, 이 부분은 앞으로 개선할 지점으로 남겨뒀습니다.',
              diagram: {
                src: '/projects/excel-pipeline-memory.svg',
                pdfSrc: '/projects/excel-pipeline-memory.png',
                alt: '엑셀 업로드 파이프라인 5단계 — 파일 수신·저장, 행 단위 읽기, 헤더 매칭·변환, 검증, 1,000건 묶음 저장 순서로 진행된다',
                caption:
                  '파일을 통째로 읽지 않고 행 단위로 읽어 바로 처리하고, 저장만 1,000건씩 묶어서 진행률을 보여줍니다.',
              },
            },
          ],
        },
        {
          title: '원자성 정책',
          items: [
            {
              label: '전량 반영 아니면 전량 원복',
              desc: '1,000행 중 700행 저장 후 701번째에서 실패하면 어디까지 반영됐는지 알 수 없어 재실행 시 중복 위험이 있어, 하나라도 실패하면 전부 되돌리는 전량 원복 정책으로 고정했습니다. 대가로 999행이 멀쩡해도 1개 오류로 전부 롤백되므로, 저장 전 타입·형식을 미리 검증해 문제 있는 행만 그 자리에서 반려하는 앞단 게이트를 뒀습니다. 트랜잭션에는 검증을 통과한 행만 들어가 흔한 실패 원인은 미리 걸러지고, 원복 전에는 실패 사유를 로그로 남깁니다.',
              diagram: {
                src: '/projects/excel-atomic-revert.svg',
                pdfSrc: '/projects/excel-atomic-revert.png',
                alt: '입력된 행이 앞단 검증 게이트를 거쳐 통과한 행만 원자적 반영 단계로 넘어가고, 검증에 걸린 행은 그 행만 반려되어 나머지 반영에 영향을 주지 않는다는 흐름도',
                caption:
                  '원자적 반영은 여전히 "전부 아니면 전무"지만, 그 안에 이미 검증을 통과한 행만 들어가기 때문에 타입 오류 같은 흔한 실패 원인은 트랜잭션에 들어가기 전에 걸러집니다.',
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
      slug: 'excel-sync-automation',
      title: '상품 데이터 반영 자동화 — 수정이력 기반 동기화',
      category: '아키텍처',
      status: '완료',
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
      summary: [
        '외부 데이터를 엑셀에 정리해 자사몰·전표 두 양식으로 각각 변환·업로드하던 9단계 프로세스를, 시스템 안에서 작업 후 동기화만 누르면 되는 2단계로 줄였습니다.',
        '업무 특성상 엑셀 자체는 없앨 수 없어, 로컬 엑셀을 오가는 대신 시스템 화면 안에 편집 화면을 내장했습니다.',
        '현업 담당자들의 불편을 직접 듣고 해결 방향을 함께 구체화했고, 건당 처리 시간을 40분에서 10분으로 줄였습니다.',
      ],
      diagram: {
        src: '/projects/excel-sync-automation.svg',
        pdfSrc: '/projects/excel-sync-automation.png',
        alt: '이전에는 데이터 정제부터 엑셀 기입 후 자사몰·전표시스템 두 양식으로 각각 변환·업로드하는 9단계 수작업이었고, 이후에는 시스템에서 저장·수정 후 동기화 버튼 또는 새벽 자동 동기화만 누르면 두 시스템에 자동 반영되는 2단계로 줄었다는 비교 흐름도',
        caption:
          '자사몰·전표시스템은 양식이 서로 달라 정제·변환·업로드를 각각 반복해야 했습니다. 수정이력을 기준으로 동기화하는 구조로 바꿔, 사용자는 저장(수정)과 동기화만 하면 두 시스템에 자동 반영됩니다.',
      },
      problem:
        '외부에서 받는 데이터가 자사 양식과 맞지 않아, 담당자가 데이터를 정제해 엑셀에 기입한 뒤 자사몰용·전표시스템용 두 양식으로 각각 변환하고 각각 업로드하는 9단계 수작업을 거쳐야 했습니다. 업무 특성상 엑셀 서식 자체를 없앨 수는 없었지만, 로컬 엑셀 파일을 오가며 반복하는 이 흐름을 시스템 안으로 끌어들여 줄이는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '시스템 안에 편집 화면 내장',
          items: [
            {
              label: '로컬 엑셀 왕복 제거',
              desc: '엑셀 서식은 유지해야 했기 때문에, 로컬 파일을 오가는 대신 시스템 화면 안에 스프레드시트 편집 UI를 내장해 담당자가 시스템을 벗어나지 않고 작업하도록 만들었습니다. 대용량 셀을 다뤄야 해서 DOM 기반 라이브러리는 성능상 채택하지 못했고, 캔버스 기반으로 렌더링하는 라이브러리를 도입했습니다.',
            },
          ],
        },
        {
          title: '수정이력 기반 동기화',
          items: [
            {
              label: '저장하면 이력이 쌓이고, 동기화로 반영',
              desc: '작업자가 시스템 안에서 저장·수정하면 그 변경이 수정이력으로 쌓이고, 동기화 버튼을 누르거나 새벽 자동 동기화 시점에 자사몰·전표시스템 두 곳에 필요한 형식으로 각각 반영되도록 만들었습니다. 사용자가 할 일은 저장(또는 수정)과 동기화, 두 단계로 줄었습니다.',
            },
          ],
        },
        {
          title: '현업과 함께 설계',
          items: [
            {
              label: '사용자 인터뷰 → 해결 방향 협의 → 개발',
              desc: '기존 9단계 프로세스를 실제로 반복하던 담당자들에게 어떤 지점이 불편한지 직접 듣고, 해결 방향을 제안해 협의한 뒤 개발했습니다. 줄여야 할 목표가 명확했던 덕분에 기능 범위를 잡기가 수월했습니다.',
            },
          ],
        },
      ],
      result: {
        before: '9단계 · 건당 약 40분',
        after: '2단계 · 건당 약 10분',
        note: '자사몰·전표시스템 두 곳에 각각 수작업으로 반영하던 흐름을 수정이력 기반 자동 동기화로 바꿔, 처리 시간을 75% 줄였습니다.',
      },
    },
    {
      slug: 'zero-downtime-schema-migration',
      title: '무중단 스키마 마이그레이션',
      category: '마이그레이션',
      status: '완료',
      hidden: true,
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['PostgreSQL'],
      summary: [
        '컬럼명을 한 번에 바꾸지 않고 확장→전환→수축 3단계로 나눠 무중단으로 표준화했습니다.',
        '한 공급사 저장이 다른 공급사 가격을 덮어쓰던 결함을 발견해, 저장 스코프를 상품+공급사로 교정했습니다.',
        'UNIQUE 제약과 NULL의 유일성 예외를 이용해 백필 없이 무중단으로 재발을 차단했습니다.',
      ],
      problem:
        '운영 중인 상품 테이블에 의미가 불명확한 컬럼명이 있었고, 여러 공급사가 각자 다른 가격을 갖도록 모델을 넓히는 과정에서 저장 스코프가 상품 단위로만 걸려 한 공급사 저장이 다른 공급사 가격까지 조용히 덮어쓰는 결함도 드러났습니다(화면엔 성공으로 표시됨). 서비스 중단·백필 없이 컬럼명을 정리하고, 재발하지 않도록 불변식을 스키마 제약으로 옮기는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '컬럼명 표준화',
          items: [
            {
              label: '확장 → 전환 → 수축, 3단계',
              desc: '이름을 한 번에 바꾸면 배포 순간 신·구 코드가 공존하는 몇 초간 한쪽이 없는 컬럼을 참조하게 됩니다. 새 컬럼 추가 후 양쪽에 쓰기(①)→읽기를 새 컬럼으로 전환(②)→충분히 관찰 후 옛 컬럼 삭제(③), 3단계로 나눴고 핵심은 2단계에서 멈춰도 정상 동작한다는 것입니다.',
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
              desc: '저장 스코프를 상품+공급사로 교정해 대상이 항상 0 또는 1행이 되게 한 뒤, 코드 방어 대신 UNIQUE(상품,공급사)·UNIQUE(상품,순위) 제약으로 재발을 차단했습니다. 순위 미지정(NULL)은 유일성 비교에서 서로 다른 값으로 취급되는 성질을 이용해, 기존 데이터를 그대로 둔 채 백필 없이 제약을 추가했습니다.',
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
      hidden: true,
      org: '유통 상품 관리 시스템 고도화',
      techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
      summary: [
        '컬럼 위치 가정이 만든 전량 유실 사고를 헤더 이름 기반 매칭으로 바꿔 재발을 차단했습니다.',
        '검증과 저장의 타입 불일치로 앞자리 0이 사라지는 사고를 원문 그대로 문자열로 다루도록 고쳤습니다.',
        '업로드 화면과 저장 프로시저에 흩어져 있던 이중 판정을 하나로 모아 10만 행도 질의 1회로 처리하게 했습니다.',
      ],
      problem:
        '엑셀 업로드 파이프라인에는 서로 다른 원인의 사고가 반복됐습니다. 컬럼 위치가 바뀌면 인식 못 해 상품코드가 유실됐고(106행×4회 반려), 검증 통과 값도 저장 시 형식이 바뀌어 브랜드코드 매칭이 실패했으며(1,114행), 화면과 저장 로직의 판단 기준이 달라 결론이 어긋나기도 했습니다(24행 반려). 재발하지 않는 구조로 파이프라인을 다시 짜는 게 과제였습니다.',
      solutionGroups: [
        {
          title: '위치 의존성 제거',
          items: [
            {
              label: '헤더 이름 기반 매칭',
              desc: '기준 열 왼쪽을 통째로 삭제하던 로직에서 컬럼 순서가 재정의되며 기준 열이 밀려 상품코드까지 삭제됐습니다(106행×4회 반려). 열 채택 기준을 "헤더 텍스트가 정의와 일치하는가" 하나로 바꿔 위치와 무관하게 읽도록 했습니다.',
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
              desc: '브랜드코드 002079처럼 형식 검증은 통과하지만 저장 시 수치형 변환으로 앞자리 0이 사라져 매칭이 실패했습니다(1,114행). 검증·저장이 같은 정의를 보지 않은 게 원인이라, 자리 표기 값은 끝까지 문자열로 다루도록 고쳤습니다.',
            },
          ],
        },
        {
          title: '판정 로직 일원화',
          items: [
            {
              label: '이중 판정 통합',
              desc: '업로드 화면과 저장 프로시저가 등록 여부를 각자 다른 기준으로 판정해 결론이 어긋나 24행이 원인 불명으로 반려됐습니다. 판정 함수를 하나로 모으고, 행 단위 조회 대신 집합 질의 1회로 대조해 10만 행이어도 질의 1회로 끝나게 했습니다.',
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
              desc: '"컬럼이 몇 개 연속으로 맞으면 검사 대상"이라는 위치 규칙은 3개와 4개를 가르는 근거가 없어, 기준을 "이름이 정의에 있는가"로 바꿔 임계값을 없앴습니다. 누락은 반려·정의 밖은 확인 요청·중복은 자동 선택, 세 갈래로 정리했습니다.',
            },
          ],
        },
      ],
      result: {
        before: '유실·반려 반복',
        after: '불일치 0건',
        note: '서식 충실도 감사 — 실제 양식 7종·49,696칸 전수 대조 결과 기준. 데이터 오류로 인한 반려·재작업을 줄여, 담당 부서의 반복 확인 업무 부담을 덜었습니다.',
      },
    },
  ] as PortfolioProject[],
  }, {
    name: '정산어택',
    kind: '사이드 프로젝트',
    projects: [
      {
        slug: 'jeongsan-attack',
        title: '정산어택',
        category: '사이드 프로젝트',
        status: '진행 중',
        org: '개인 사이드 프로젝트',
        techStack: ['React', 'Kotlin', 'Spring Boot'],
        summary: [
          '카카오톡 등 기존 정산 기능은 N분의 1만 지원해, 참여 형태가 제각각인 술자리 같은 모임은 총무가 일일이 수기로 계산해야 했습니다.',
          '누가 마셨는지, 몇 차까지 참여했는지 같은 세부 조건까지 반영해 정산할 수 있는 웹앱을 혼자 기획·개발하고 있습니다.',
          '정산을 총무 혼자 떠안는 게 아니라 참여자들이 함께 입력하는 구조로 만들어, 모임 이후의 피로를 줄이는 게 목표입니다.',
        ],
        problem:
          '카카오톡이나 기존 정산 앱들은 N분의 1 계산만 지원하지만, 실제 술자리는 마시는 사람과 안 마시는 사람이 섞여 있고 1차·2차마다 참여 인원도 달라져 훨씬 세분화된 정산이 필요합니다. 이 복잡한 계산과 취합을 총무 한 사람이 떠안아야 해 모임 후에도 총무만 피곤한 구조였습니다.',
        solutionGroups: [
          {
            title: '기획 방향',
            items: [
              {
                label: '세분화된 정산 + 참여형 입력',
                desc: '술을 마신 사람과 안 마신 사람, 라운드별로 참여자가 달라지는 상황까지 반영해 정산할 수 있게 설계하고 있습니다. 총무 혼자 계산·공지하는 대신 참여자들이 각자 자기 몫을 직접 입력하는 구조로 정산 부담을 나누는 게 목표입니다.',
              },
            ],
          },
        ],
        result: {
          note: '프론트엔드 목업은 완성했고, 현재 React·Kotlin·Spring Boot로 백엔드를 개발하고 있습니다. 백엔드 개발이 끝나면 기술적 의사결정을 다루는 카드를 추가할 예정입니다.',
        },
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
