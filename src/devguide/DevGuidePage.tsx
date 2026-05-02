import { useState } from 'react'

type RoleKey = '기획자' | '디자이너' | '앱개발자' | '백엔드'
type RoleLevel = '주도' | '참여' | '검토'

const ROLES: Record<RoleKey, { color: string; bg: string; border: string; emoji: string }> = {
  기획자:   { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', emoji: '💡' },
  디자이너: { color: '#5b21b6', bg: '#ede9fe', border: '#c4b5fd', emoji: '🎨' },
  앱개발자: { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', emoji: '📱' },
  백엔드:   { color: '#1e3a8a', bg: '#dbeafe', border: '#93c5fd', emoji: '⚙️' },
}

interface PhaseItem {
  label: string
  desc: string
  icon: string
  highlight?: boolean
  roles: { key: RoleKey; level: RoleLevel }[]
}

interface DetailItem {
  label: string
  desc: string
  icon: string
  tags?: string[]
  roles?: { key: RoleKey; level: RoleLevel }[]
}

interface DetailSection {
  title: string
  items: DetailItem[]
}

interface Phase {
  id: number
  emoji: string
  title: string
  subtitle: string
  color: { bg: string; border: string; accent: string; badge: string; badgeBg: string }
  intro: string
  rolesSummary: { key: RoleKey; level: RoleLevel; note: string }[]
  items: PhaseItem[]
  details: DetailSection[]
}

// ── 전체 관통 주제 ─────────────────────────────────────────
const MONETIZATION = {
  emoji: '💰',
  title: '수익화',
  subtitle: 'Monetization — 기획부터 출시까지 항상 염두에 둘 것',
  intro: '수익화는 마지막 단계가 아닙니다. 기획 단계에서 모델을 정해야 설계·개발·출시가 일관됩니다.',
  rolesSummary: [
    { key: '기획자'   as RoleKey, level: '주도' as RoleLevel, note: '수익 모델 설계 · 정책 수립' },
    { key: '디자이너' as RoleKey, level: '참여' as RoleLevel, note: '구독/결제 UI 디자인' },
    { key: '앱개발자' as RoleKey, level: '참여' as RoleLevel, note: '인앱 결제 모듈 연동' },
    { key: '백엔드'   as RoleKey, level: '참여' as RoleLevel, note: '결제 API · 구독 관리 서버' },
  ],
  items: [
    { label: '광고',        desc: '앱 내 광고 수익 (배너, 전면 광고 등)',   icon: '📢', roles: [{ key: '기획자' as RoleKey, level: '주도' as RoleLevel }, { key: '앱개발자' as RoleKey, level: '참여' as RoleLevel }] },
    { label: '구독',        desc: '월정액 프리미엄 기능 제공',              icon: '🔄', roles: [{ key: '기획자' as RoleKey, level: '주도' as RoleLevel }, { key: '디자이너' as RoleKey, level: '참여' as RoleLevel }, { key: '앱개발자' as RoleKey, level: '참여' as RoleLevel }, { key: '백엔드' as RoleKey, level: '참여' as RoleLevel }] },
    { label: '유료 서비스', desc: '특정 기능 / 콘텐츠 일회성 결제',         icon: '💳', roles: [{ key: '기획자' as RoleKey, level: '주도' as RoleLevel }, { key: '디자이너' as RoleKey, level: '참여' as RoleLevel }, { key: '앱개발자' as RoleKey, level: '참여' as RoleLevel }, { key: '백엔드' as RoleKey, level: '참여' as RoleLevel }] },
  ],
}

const SECURITY = {
  emoji: '🔐',
  title: '보안',
  subtitle: 'Security — 전 단계를 관통하는 필수 주제',
  intro: '보안은 마지막에 추가하는 것이 아닙니다. 기획부터 운영까지 각 단계마다 고려해야 합니다.',
  stageItems: [
    { stage: '기획', icon: '💡', desc: '어떤 개인정보를 수집할지 결정 (개인정보보호법 준수)', color: '#a16207' },
    { stage: '설계', icon: '📐', desc: '인증/인가 방식 설계, 데이터 암호화 전략 수립', color: '#1d4ed8' },
    { stage: '개발', icon: '🔨', desc: 'SQL Injection 방지, XSS 방어, 비밀번호 해싱 (bcrypt)', color: '#15803d' },
    { stage: '배포', icon: '🚀', desc: 'HTTPS, 방화벽 설정, 시크릿 관리 (환경변수 분리)', color: '#86198f' },
    { stage: '운영', icon: '🏁', desc: '보안 패치 적용, 침입 탐지, 정기 취약점 점검', color: '#c2410c' },
  ],
}

// ── 단계별 데이터 ───────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: 1,
    emoji: '💡',
    title: '기획',
    subtitle: 'Planning',
    color: { bg: '#fef9c3', border: '#fde047', accent: '#a16207', badge: '#78350f', badgeBg: '#fef08a' },
    intro: '기획은 관점을 가져야 한다. 기획은 생각하는 그 자체.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '전체 주도' },
      { key: '디자이너', level: '참여', note: '경쟁 서비스 UI 분석' },
      { key: '앱개발자', level: '참여', note: '기술 실현 가능성 의견' },
      { key: '백엔드',   level: '참여', note: '기술 실현 가능성 의견' },
    ],
    items: [
      { label: '타겟 유저', desc: '페르소나 설정 — 누가 쓸지 명확히 정의', icon: '🎯',
        roles: [{ key: '기획자', level: '주도' }] },
      { label: '핵심 기능', desc: '꼭 있어야 할 기능을 최소한으로 정리', icon: '⚡',
        roles: [{ key: '기획자', level: '주도' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '경쟁 서비스 분석', desc: '비슷한 서비스를 뜯어보고 약점 파악', icon: '🔍',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: '차별화 전략', desc: '우리가 어떻게 다를지 명확히 정의', icon: '🚀',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
    ],
    details: [
      {
        title: '수익 모델 방향 확정',
        items: [
          { label: '수익 모델 결정', desc: '광고? 구독? 유료 기능? 기획 초기에 방향을 확정해야 이후 설계·개발이 일관됩니다.', icon: '💰', tags: ['광고', '구독', '인앱 결제'], roles: [{ key: '기획자', level: '주도' }] },
          { label: 'BM 문서화', desc: '수익 모델을 팀 전체가 공유할 수 있도록 문서로 정리. 정책 변경 이력도 함께 관리.', icon: '📄', roles: [{ key: '기획자', level: '주도' }] },
        ],
      },
      {
        title: '개인정보 & 법률 검토',
        items: [
          { label: '개인정보 수집 범위 결정', desc: '어떤 데이터를 수집할지 초기에 명확히 해야 개인정보보호법 위반을 방지할 수 있습니다.', icon: '🔏', tags: ['개인정보보호법', 'GDPR'], roles: [{ key: '기획자', level: '주도' }] },
          { label: '이용약관 / 개인정보처리방침', desc: '앱 출시 전 반드시 필요한 법적 문서. 기획 단계에서 초안 작성 시작.', icon: '📋', roles: [{ key: '기획자', level: '주도' }] },
        ],
      },
    ],
  },
  {
    id: 2,
    emoji: '📐',
    title: '설계',
    subtitle: 'Architecture',
    color: { bg: '#eff6ff', border: '#93c5fd', accent: '#1d4ed8', badge: '#1e3a8a', badgeBg: '#bfdbfe' },
    intro: '사용자가 쓰게 될 화면이 핵심. 모두가 함께 만드는 단계.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '화면 흐름 · 시나리오 · 기능 목록' },
      { key: '디자이너', level: '주도', note: '화면 설계 · UX · 디자인 가이드' },
      { key: '앱개발자', level: '주도', note: '앱 기술 스택 · 화면 구조 의견' },
      { key: '백엔드',   level: '주도', note: '데이터 설계 · API 설계' },
    ],
    items: [
      { label: '화면 설계', desc: '사용자 흐름 중심으로 모든 화면 설계', icon: '🖥',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '주도' }, { key: '앱개발자', level: '참여' }] },
      { label: '시나리오', desc: '어떤 과정으로 목표에 도달하는지 흐름 정의', icon: '📋',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: 'UX', desc: '사용자 경험 — 쓰기 쉽고, 쓰고 싶게', icon: '✨',
        roles: [{ key: '디자이너', level: '주도' }, { key: '기획자', level: '참여' }] },
      { label: '데이터 설계 (ERD)', desc: '테이블 구조, ERD 작성', icon: '🗄',
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '검토' }] },
      { label: 'API 설계', desc: '기능과 연결되는 엔드포인트 정의', icon: '🔌',
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
      { label: '기능 확정 / 디자인 가이드', desc: '기능 목록 최종 확정 + 디자인 가이드라인', icon: '🎨',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '주도' }] },
    ],
    details: [
      {
        title: '시스템 아키텍처',
        items: [
          { label: '시스템 구성도', desc: '앱 ↔ API 서버 ↔ DB ↔ 외부 연동 전체 흐름을 다이어그램으로 정의. 팀원 모두가 구조를 공유해야 합니다.', icon: '🗺', tags: ['Component Diagram', 'Sequence Diagram'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: '인프라 설계', desc: 'OCI 인스턴스 구성, RDB(PostgreSQL), 스토리지, 캐시(Redis) 등 인프라 레이어 설계.', icon: '☁️', tags: ['OCI', 'PostgreSQL', 'Redis'], roles: [{ key: '백엔드', level: '주도' }] },
        ],
      },
      {
        title: '기술 스택 선정 근거',
        items: [
          { label: '왜 이 기술을 선택했는가', desc: '"왜 Spring Boot? 왜 PostgreSQL? 왜 Kotlin?" — 면접에서 반드시 나오는 질문. 선택 근거를 문서로 남겨야 합니다.', icon: '🤔', tags: ['ADR (Architecture Decision Record)'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '주도' }] },
          { label: '비기능 요구사항 정의', desc: '응답 시간 목표, 동시 접속 수, 데이터 보존 기간 등 성능/가용성 목표를 수치로 정의.', icon: '📊', tags: ['성능 목표', 'SLA'], roles: [{ key: '기획자', level: '참여' }, { key: '백엔드', level: '주도' }] },
        ],
      },
      {
        title: '외부 연동 설계',
        items: [
          { label: 'OAuth 연동 설계', desc: '카카오 / 구글 OAuth 흐름, 토큰 저장 방식, 갱신 전략을 미리 설계해야 개발 중 혼선이 없습니다.', icon: '🔑', tags: ['Kakao OAuth', 'Google OAuth', 'JWT', 'Refresh Token'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: '푸시 알림 연동', desc: 'FCM(Firebase Cloud Messaging) 연동 방식 사전 설계. 앱 / 백엔드 모두 영향.', icon: '🔔', tags: ['FCM', 'Push Notification'], roles: [{ key: '앱개발자', level: '주도' }, { key: '백엔드', level: '참여' }] },
        ],
      },
    ],
  },
  {
    id: 3,
    emoji: '🔨',
    title: '개발',
    subtitle: 'Development',
    color: { bg: '#f0fdf4', border: '#86efac', accent: '#15803d', badge: '#14532d', badgeBg: '#bbf7d0' },
    intro: '기초부터 탄탄하게. 프론트 · 백엔드 · 연동 순서로.',
    rolesSummary: [
      { key: '기획자',   level: '참여', note: 'QA · 기획 보완 · 우선순위 조정' },
      { key: '디자이너', level: '주도', note: '화면 디자인 시스템 · 에셋 제작' },
      { key: '앱개발자', level: '주도', note: '앱 화면 개발 · 연동' },
      { key: '백엔드',   level: '주도', note: 'API · CRUD · 비즈니스 로직 · DB' },
    ],
    items: [
      { label: '앱 화면 개발', desc: '기초 화면 개발 — 설계 기반으로 구현 (Kotlin)', icon: '📱',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: '백엔드 개발', desc: 'API · CRUD · 비즈니스 로직 · 예외처리 · DB 구축', icon: '⚙️',
        roles: [{ key: '백엔드', level: '주도' }] },
      { label: '프론트 ↔ 백엔드 연동', desc: '실제 API 연결 + 통합 테스트', icon: '🔗',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '백엔드', level: '주도' }] },
      { label: '테스트', desc: '시나리오 기반 테스트 — 기획자가 정의한 흐름대로 검증', icon: '✅', highlight: true,
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '소스 관리 (GitHub)', desc: 'GitHub + 브랜치 전략 (개발 / 운영 분리)', icon: '📦', highlight: true,
        roles: [{ key: '앱개발자', level: '주도' }, { key: '백엔드', level: '주도' }] },
    ],
    details: [
      {
        title: '협업 프로세스',
        items: [
          { label: '개발 환경 분리', desc: 'local → dev → staging → prod 환경을 분리해야 운영 DB에 테스트 데이터가 섞이지 않습니다.', icon: '🌍', tags: ['local', 'dev', 'staging', 'prod'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: '환경변수 관리', desc: '.env 파일로 API 키/시크릿을 분리하고 절대 git에 올리지 않습니다. 팀 공유는 1Password, Notion 시크릿 등 별도 채널 사용.', icon: '🔑', tags: ['.env', 'gitignore', 'Secret Management'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '주도' }] },
        ],
      },
      {
        title: '품질 관리',
        items: [
          { label: '로깅 전략', desc: 'ERROR / WARN / INFO / DEBUG 레벨 구분, 로그 저장 위치, 민감정보 마스킹 정책을 초기에 정합니다.', icon: '📝', tags: ['Logback', 'SLF4J', 'Log Level'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: '에러 처리 정책', desc: '예외 클래스 체계 설계, 사용자에게 보여줄 에러 메시지 vs 개발자 로그 분리, 공통 에러 응답 포맷 정의.', icon: '🚨', tags: ['GlobalExceptionHandler', 'ErrorCode Enum', 'HTTP Status'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
        ],
      },
    ],
  },
  {
    id: 4,
    emoji: '🚀',
    title: '배포',
    subtitle: 'Deploy',
    color: { bg: '#fdf4ff', border: '#e879f9', accent: '#86198f', badge: '#581c87', badgeBg: '#f5d0fe' },
    intro: '서버를 세우고 실제 세상으로 내보낸다.',
    rolesSummary: [
      { key: '기획자',   level: '참여', note: '스토어 설명문 · 마케팅 텍스트 작성' },
      { key: '디자이너', level: '참여', note: '스토어 아이콘 · 스크린샷 제작' },
      { key: '앱개발자', level: '주도', note: '앱 빌드 · 구글 플레이 등록' },
      { key: '백엔드',   level: '주도', note: '서버 구축 (OCI) · HTTPS 적용' },
    ],
    items: [
      { label: '서버 구축', desc: 'OCI 인프라 세팅 (이미 준비 완료 ✅)', icon: '🖥',
        roles: [{ key: '백엔드', level: '주도' }] },
      { label: '앱 등록', desc: '구글 플레이 스토어 심사 + 등록', icon: '📲',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '기획자', level: '참여' }, { key: '디자이너', level: '참여' }] },
      { label: 'HTTPS 적용', desc: 'SSL 인증서 — 보안 필수 항목', icon: '🔒',
        roles: [{ key: '백엔드', level: '주도' }] },
    ],
    details: [
      {
        title: 'CI/CD & 자동화',
        items: [
          { label: 'CI/CD 파이프라인', desc: 'GitHub Actions로 코드 push 시 자동 빌드 → 테스트 → 배포가 이루어지도록 구성. 사람이 수동으로 배포하면 실수가 생깁니다.', icon: '⚙️', tags: ['GitHub Actions', 'Jenkins', 'Automated Deploy'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: '도커 / 컨테이너화', desc: '애플리케이션을 Docker 이미지로 패키징하면 환경 차이 문제가 없어지고 배포/롤백이 훨씬 쉬워집니다.', icon: '🐳', tags: ['Docker', 'docker-compose', 'Container Registry'], roles: [{ key: '백엔드', level: '주도' }] },
        ],
      },
      {
        title: '안정성 확보',
        items: [
          { label: '무중단 배포 전략', desc: 'Blue-Green 또는 Rolling 배포로 서비스 중단 없이 새 버전을 올릴 수 있습니다. 사용자가 배포 중 에러를 만나지 않도록.', icon: '🔵', tags: ['Blue-Green', 'Rolling Update', 'Zero Downtime'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: '롤백 전략', desc: '배포 실패 시 즉시 이전 버전으로 되돌릴 수 있는 절차를 사전에 준비. 당황하지 않으려면 훈련이 필요합니다.', icon: '↩️', tags: ['Rollback Plan', 'Version Tag'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: 'DB 마이그레이션', desc: 'Flyway 또는 Liquibase로 DB 스키마 변경을 버전 관리. 배포 시 DB와 코드 버전이 맞아야 합니다.', icon: '🗄', tags: ['Flyway', 'Liquibase', 'Schema Migration'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: '도메인 / DNS / 로드밸런서', desc: '도메인 연결, DNS A레코드 설정, HTTPS 인증서(Let\'s Encrypt), 트래픽 분산을 위한 로드밸런서 구성.', icon: '🌐', tags: ['DNS', 'Let\'s Encrypt', 'Load Balancer', 'Nginx'], roles: [{ key: '백엔드', level: '주도' }] },
        ],
      },
    ],
  },
  {
    id: 5,
    emoji: '🏁',
    title: '출시 이후',
    subtitle: 'Post-Launch',
    color: { bg: '#fff7ed', border: '#fdba74', accent: '#c2410c', badge: '#7c2d12', badgeBg: '#fed7aa' },
    intro: '"완료가 시작이다." — 출시 후가 진짜 시작.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '사용자 피드백 수집 · 기능 개선 기획' },
      { key: '디자이너', level: '참여', note: 'UI 개선 · 신규 화면 디자인' },
      { key: '앱개발자', level: '참여', note: '버그 수정 · 기능 추가 개발' },
      { key: '백엔드',   level: '참여', note: '장애 대응 · 서버 모니터링' },
    ],
    items: [
      { label: '유지보수', desc: '버그 수정, 서버 안정성 관리', icon: '🔧',
        roles: [{ key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '코드 관리', desc: '기술 부채 정리, 리팩토링', icon: '📁',
        roles: [{ key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '기능 추가 / 개선', desc: '사용자 피드백 기반 지속 개선 → 기획 단계로 순환', icon: '➕',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '장애 대응', desc: '이슈 발생 시 빠른 탐지 + 복구', icon: '🚨', highlight: true,
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
    ],
    details: [
      {
        title: '모니터링 & 알림',
        items: [
          { label: '모니터링 도구', desc: 'Grafana + Prometheus로 서버 CPU·메모리·응답시간 대시보드. Sentry로 앱 크래시 실시간 감지.', icon: '📊', tags: ['Grafana', 'Prometheus', 'Sentry', 'CloudWatch'], roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: '로그 수집 / 분석', desc: 'CloudWatch Logs 또는 ELK 스택(Elasticsearch + Logstash + Kibana)으로 로그를 중앙에서 검색·분석.', icon: '📋', tags: ['ELK Stack', 'CloudWatch Logs', 'Kibana'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: '장애 알림 시스템', desc: '임계값 초과 시 Slack / SMS 알림이 자동으로 오도록 설정. 새벽에 서버가 죽어도 바로 알 수 있어야 합니다.', icon: '🔔', tags: ['Slack Webhook', 'PagerDuty', 'Alerting'], roles: [{ key: '백엔드', level: '주도' }] },
        ],
      },
      {
        title: '데이터 & 성장',
        items: [
          { label: '사용자 분석', desc: 'Firebase Analytics, Mixpanel, Amplitude 등으로 사용자 행동 데이터를 분석. "어느 화면에서 이탈하는가?" 를 알아야 개선 방향이 보입니다.', icon: '📈', tags: ['Firebase Analytics', 'Mixpanel', 'Amplitude'], roles: [{ key: '기획자', level: '주도' }, { key: '앱개발자', level: '참여' }] },
          { label: 'A/B 테스트', desc: '두 가지 UI/기능을 나눠서 배포하고 어느 쪽 전환율이 높은지 측정. 데이터 기반 의사결정의 핵심.', icon: '⚗️', tags: ['Firebase Remote Config', 'A/B Testing'], roles: [{ key: '기획자', level: '주도' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
          { label: 'APM (성능 측정)', desc: 'API 응답 시간, DB 쿼리 병목, 메모리 누수 탐지. 느려지면 사용자가 떠납니다.', icon: '⚡', tags: ['APM', 'New Relic', 'Pinpoint'], roles: [{ key: '백엔드', level: '주도' }] },
          { label: 'DB 백업 / 복구 정책', desc: 'DB 자동 백업 주기(일간/주간), 복구 목표 시간(RTO), 복구 목표 시점(RPO)을 정의하고 실제로 복구 훈련도 해봐야 합니다.', icon: '💾', tags: ['Backup', 'RTO', 'RPO', 'Disaster Recovery'], roles: [{ key: '백엔드', level: '주도' }] },
        ],
      },
    ],
  },
]

// ── 상수 ────────────────────────────────────────────────────
const LEVEL_STYLE: Record<RoleLevel, { label: string; opacity: string }> = {
  주도: { label: '주도', opacity: 'opacity-100' },
  참여: { label: '참여', opacity: 'opacity-60' },
  검토: { label: '검토', opacity: 'opacity-40' },
}

// ── 서브 컴포넌트 ────────────────────────────────────────────
function RoleBadge({ roleKey, level, size = 'sm' }: { roleKey: RoleKey; level: RoleLevel; size?: 'xs' | 'sm' }) {
  const role = ROLES[roleKey]
  const isLead = level === '주도'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'} ${LEVEL_STYLE[level].opacity}`}
      style={{ background: role.bg, borderColor: role.border, color: role.color, fontWeight: isLead ? 700 : 500 }}
    >
      <span>{role.emoji}</span>
      <span>{roleKey}</span>
      {size === 'sm' && (
        <span className="rounded-full px-1 text-[9px]" style={{ background: role.border, color: role.color, opacity: 0.85 }}>
          {level}
        </span>
      )}
    </span>
  )
}

function CrossCuttingBanner({
  emoji, accentClass, borderClass, labelColor, label, title, subtitle, intro, children,
}: {
  emoji: string
  accentClass: string
  borderClass: string
  labelColor: string
  label: string
  title: string
  subtitle: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div className={`mb-8 overflow-hidden rounded-2xl border ${borderClass} shadow-lg`}>
      <div className={`flex items-center gap-2 border-b ${borderClass} px-6 py-3`}>
        <span className="text-lg">{emoji}</span>
        <span className={`text-xs font-black uppercase tracking-widest ${labelColor}`}>전체를 관통하는 주제</span>
        <span className={`ml-auto rounded-full border ${borderClass} px-2.5 py-0.5 text-[10px] font-bold ${labelColor}`}>
          {label}
        </span>
      </div>
      <div className="px-6 py-5">
        <div className="mb-1 flex items-baseline gap-3">
          <h2 className={`text-xl font-bold ${accentClass}`}>{title}</h2>
          <span className="text-sm text-zinc-400">{subtitle}</span>
        </div>
        <p className="mb-5 text-sm leading-7 text-zinc-300">{intro}</p>
        {children}
      </div>
    </div>
  )
}

function DetailDrawer({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 드로어 패널 */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-zinc-900 shadow-2xl">
        {/* 드로어 헤더 */}
        <div
          className="flex items-center gap-3 border-b px-6 py-5"
          style={{ borderColor: `${phase.color.border}40` }}
        >
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-2xl"
            style={{ background: phase.color.bg, borderColor: phase.color.border }}
          >
            {phase.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{ background: phase.color.badgeBg, color: phase.color.badge }}
              >
                0{phase.id}
              </span>
              <span className="text-lg font-bold" style={{ color: phase.color.accent }}>
                {phase.title}
              </span>
              <span className="text-sm text-zinc-400">{phase.subtitle}</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">심화 내용 — 실무에서 챙겨야 할 것들</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 드로어 바디 */}
        <div className="flex-1 space-y-8 px-6 py-6">
          {phase.details.map((section) => (
            <div key={section.title}>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-400">
                {section.title}
              </p>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/8 bg-white/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-xl leading-none">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-white">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-300">{item.desc}</p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.roles && item.roles.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {item.roles.map((r) => (
                              <RoleBadge key={r.key} roleKey={r.key} level={r.level} size="xs" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 드로어 푸터 */}
        <div className="border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────
export function DevGuidePage() {
  const [detailPhaseId, setDetailPhaseId] = useState<number | null>(null)
  const detailPhase = PHASES.find((p) => p.id === detailPhaseId) ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 text-white">
      {/* 배경 그리드 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Team Side Project · Development Guide
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            서비스 개발
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              전체 과정
            </span>
          </h1>
        </div>

        {/* 역할 범례 */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {(Object.keys(ROLES) as RoleKey[]).map((key) => {
            const r = ROLES[key]
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ background: r.bg, borderColor: r.border, color: r.color }}
              >
                {r.emoji} {key}
              </span>
            )
          })}
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            <span className="font-bold text-white">주도</span> = 메인 담당
            <span className="mx-1 opacity-40">|</span>
            <span className="opacity-60">참여</span> = 함께 관여
          </span>
        </div>

        {/* 전체 관통 주제들 */}
        <CrossCuttingBanner
          emoji="💰"
          accentClass="text-teal-300"
          borderClass="border-teal-500/30"
          labelColor="text-teal-400"
          label="01 기획 단계부터 → 출시까지 계속"
          title={MONETIZATION.title}
          subtitle={MONETIZATION.subtitle}
          intro={MONETIZATION.intro}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">역할별 담당</p>
              {MONETIZATION.rolesSummary.map((r) => {
                const role = ROLES[r.key]
                return (
                  <div key={r.key} className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                    style={{ background: `${role.bg}30`, borderColor: `${role.border}40` }}>
                    <span className="text-base">{role.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: role.color }}>{r.key}</span>
                        <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${r.level === '주도' ? 'opacity-100' : 'opacity-60'}`}
                          style={{ background: role.border, color: role.color }}>{r.level}</span>
                      </div>
                      <p className="truncate text-xs text-zinc-400">{r.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">주요 수익 모델</p>
              {MONETIZATION.items.map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
                  <span className="mt-0.5 text-base leading-none">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100">{item.label}</p>
                    <p className="text-sm text-zinc-300">{item.desc}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.roles.map((r) => <RoleBadge key={r.key} roleKey={r.key} level={r.level} size="xs" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CrossCuttingBanner>

        <CrossCuttingBanner
          emoji="🔐"
          accentClass="text-rose-300"
          borderClass="border-rose-500/30"
          labelColor="text-rose-400"
          label="기획 → 설계 → 개발 → 배포 → 운영 전체"
          title={SECURITY.title}
          subtitle={SECURITY.subtitle}
          intro={SECURITY.intro}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.stageItems.map((s) => (
              <div key={s.stage} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.stage}</span>
                </div>
                <p className="text-xs leading-5 text-zinc-300">{s.desc}</p>
              </div>
            ))}
          </div>
        </CrossCuttingBanner>

        {/* 타임라인 */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-[28px] top-8 hidden w-0.5 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-800 sm:block"
            style={{ height: 'calc(100% - 4rem)' }}
          />

          <div className="space-y-8">
            {PHASES.map((phase) => (
              <div key={phase.id} className="flex gap-5 sm:gap-8">
                {/* 스텝 원형 */}
                <div className="relative flex-shrink-0">
                  <div
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl shadow-lg"
                    style={{ background: phase.color.bg, borderColor: phase.color.border }}
                  >
                    {phase.emoji}
                  </div>
                </div>

                {/* 카드 */}
                <div
                  className="flex-1 overflow-hidden rounded-2xl border shadow-lg"
                  style={{ background: `${phase.color.bg}12`, borderColor: `${phase.color.border}50` }}
                >
                  {/* 카드 헤더 */}
                  <div className="border-b px-6 py-5" style={{ borderColor: `${phase.color.border}35` }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: phase.color.badgeBg, color: phase.color.badge }}
                      >
                        0{phase.id}
                      </span>
                      <h2 className="text-xl font-bold tracking-tight" style={{ color: phase.color.accent }}>
                        {phase.title}
                      </h2>
                      <span className="text-sm font-medium text-zinc-500">{phase.subtitle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{phase.intro}</p>

                    {/* 역할 요약 */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {phase.rolesSummary.map((r) => {
                        const role = ROLES[r.key]
                        return (
                          <div key={r.key} className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                            style={{ background: `${role.bg}60`, borderColor: `${role.border}60` }}>
                            <span className="text-base">{role.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold" style={{ color: role.color }}>{r.key}</span>
                                <span
                                  className={`rounded px-1 py-0.5 text-[9px] font-bold ${r.level === '주도' ? 'opacity-100' : 'opacity-60'}`}
                                  style={{ background: role.border, color: role.color }}
                                >
                                  {r.level}
                                </span>
                              </div>
                              <p className="truncate text-xs text-zinc-400">{r.note}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 세부 항목 */}
                  <div className="grid gap-2.5 p-5 sm:grid-cols-2 sm:p-6">
                    {phase.items.map((item) => (
                      <div
                        key={item.label}
                        className={`group relative flex flex-col gap-2.5 rounded-xl border p-4 transition ${
                          item.highlight ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        {item.highlight && (
                          <div
                            className="pointer-events-none absolute -inset-px rounded-xl opacity-25"
                            style={{ border: `1.5px solid ${phase.color.border}` }}
                          />
                        )}
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex-shrink-0 text-lg leading-none">{item.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-zinc-200 leading-tight">
                              {item.label}
                              {item.highlight && (
                                <span
                                  className="ml-1.5 inline-block rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-wider"
                                  style={{ background: phase.color.border, color: phase.color.badge }}
                                >
                                  중요
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-sm leading-relaxed text-zinc-300">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.roles.map((r) => (
                            <RoleBadge key={r.key} roleKey={r.key} level={r.level} size="xs" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 상세 보기 버튼 */}
                  <div className="border-t px-6 py-4" style={{ borderColor: `${phase.color.border}25` }}>
                    <button
                      onClick={() => setDetailPhaseId(phase.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:opacity-90"
                      style={{
                        background: `${phase.color.bg}20`,
                        borderColor: `${phase.color.border}60`,
                        color: phase.color.accent,
                      }}
                    >
                      <span>🔍 심화 내용 보기</span>
                      <span className="rounded-full border px-2 py-0.5 text-[10px]"
                        style={{ borderColor: phase.color.border, color: phase.color.accent }}>
                        +{phase.details.reduce((acc, s) => acc + s.items.length, 0)}개
                      </span>
                      <span className="ml-auto text-xs opacity-50">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-800/40 px-8 py-5 backdrop-blur-sm">
            <span className="text-2xl">🏁</span>
            <div className="text-left">
              <p className="text-sm font-bold text-white">완료가 시작이다.</p>
              <p className="mt-0.5 text-xs text-zinc-400">출시 후가 진짜 서비스의 시작입니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 드로어 */}
      {detailPhase && (
        <DetailDrawer phase={detailPhase} onClose={() => setDetailPhaseId(null)} />
      )}
    </div>
  )
}
