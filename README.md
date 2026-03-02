# 24시간이 모자라 (Frontend)

**24시간 운영하는 카페/음식점/전기차 충전소**를 조회하고, 지도 위에 표시하는 웹앱의 프론트엔드 프로젝트입니다.

## 스택

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Java (별도 프로젝트 / AWS EC2)
- **DB**: PostgreSQL

## 요구사항(요약)

- **24시간 운영 장소 조회**: 카페 / 음식점 / 전기차 충전소
- **지도 표시**: 조회 결과를 지도 위에 마커로 표시
- **내 주변 1km 반경 조회**

자세한 내용은 `docs/README.md`를 참고해주세요.

## 문서

- 상세 문서: `docs/README.md`

## 실행 방법

```bash
npm install
npm run dev
```

## 빌드 / 프리뷰

```bash
npm run build
npm run preview
```

## 환경변수

백엔드 API가 분리되어 있으므로 프론트는 API Base URL을 환경변수로 받는 것을 권장합니다.

- `VITE_API_BASE_URL` (기본값: `http://localhost:8080`)
- `VITE_NAVER_MAPS_KEY_ID` (네이버 지도 JS SDK `ncpKeyId`)
- `VITE_APP_TARGET`
  - 미설정: 기존 프로파일 웹 전체
  - `24hours`: **앱 배포용(`/24hours/app`만 풀스크린 렌더링)**

로컬 개발 예시:

```bash
# .env.local (git ignore됨)
VITE_API_BASE_URL=http://localhost:8080
VITE_NAVER_MAPS_KEY_ID=YOUR_NAVER_MAPS_KEY_ID
VITE_APP_TARGET=24hours
```

## 주요 수정 위치(현 프로젝트 기준)

- 데이터/문구: `src/profile.ts`
- 페이지 레이아웃(UI): `src/App.tsx`

## 배포 메모

Vite 프로젝트를 GitHub Pages(프로젝트 페이지)로 배포할 경우, 리포지토리 이름에 맞게 `base` 설정이 필요합니다.

- 예: 리포지토리가 `profile` 이라면 `vite.config.ts`에 `base: '/profile/'` 추가
