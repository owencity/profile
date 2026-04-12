import type { ApiConfig, TourismResponse } from './types'

const SERVICE_KEY = import.meta.env.VITE_KTO_SERVICE_KEY as string | undefined

const BASE = 'https://apis.data.go.kr/B551011'

export const API_CONFIGS: ApiConfig[] = [
  {
    id: 'wellness',
    name: '웰니스 관광정보',
    nameEn: 'Wellness Tourism',
    description: '힐링·명상·뷰티·스파·자연치유 등 국내 웰니스 관광지 정보',
    explainText:
      '한국관광공사가 선정한 국내 웰니스 관광지 목록입니다. 온천/사우나, 찜질방, 한방 체험, 힐링 명상, 뷰티 스파, 자연 치유 등 테마별 장소를 제공합니다. 수정일 최신순으로 표시됩니다.',
    icon: '🌿',
    color: 'bg-emerald-50 border-emerald-200',
    renderType: 'place',
    endpoint: `${BASE}/WellnessTursmService`,
    listOperation: 'areaBasedList',
    extraParams: {
      langDivCd: 'KOR',
      arrange: 'C',        // 수정일순(최신순)
      contentTypeId: '12', // 관광지
    },
    columns: [
      { key: 'title', label: '이름' },
      { key: 'baseAddr', label: '주소' },
      { key: 'tel', label: '전화' },
      { key: 'wellnessThemaCd', label: '테마' },
    ],
    imageKey: 'thumbImage',
    titleKey: 'title',
    addressKey: 'baseAddr',
  },
  {
    id: 'pet',
    name: '반려동물 동반여행',
    nameEn: 'Pet-Friendly Tourism',
    description: '반려동물과 함께 방문할 수 있는 관광지·숙박·음식점 정보',
    explainText:
      '반려동물과 함께 입장·숙박·식사가 가능한 장소 정보입니다. 서울 중심(광화문) 기준 반경 20km 이내의 반려동물 동반 허용 시설을 거리순으로 보여줍니다. 관광지·문화시설·숙박·음식점 등 다양한 유형의 장소를 확인할 수 있습니다.',
    icon: '🐾',
    color: 'bg-amber-50 border-amber-200',
    renderType: 'place',
    endpoint: `${BASE}/KorPetTourService2`,
    listOperation: 'locationBasedList2',
    extraParams: {
      mapX: '126.9784',   // 서울 광화문 경도
      mapY: '37.5760',    // 서울 광화문 위도
      radius: '20000',    // 최대 반경 20km
      arrange: 'E',       // 거리순
    },
    columns: [
      { key: 'title', label: '이름' },
      { key: 'addr1', label: '주소' },
      { key: 'tel', label: '전화' },
      { key: 'contenttypeid', label: '유형' },
      { key: 'dist', label: '거리' },
    ],
    imageKey: 'firstimage2',
    titleKey: 'title',
    addressKey: 'addr1',
  },
  {
    id: 'related',
    name: '연관 관광지 정보',
    nameEn: 'Related Attractions',
    description: '관광지별로 함께 방문하는 연관 관광지 추천 데이터 (강원도 원주시 기준)',
    explainText:
      '실제 방문자 이동 데이터를 기반으로 "이 관광지를 방문한 사람들이 함께 찾은 곳"을 순위별로 보여줍니다. 왼쪽은 기준 관광지, 오른쪽 화살표(→)는 함께 방문한 연관 관광지입니다. 여행 동선 계획에 활용할 수 있습니다. — 기준: 강원도 원주시 2025년 4월',
    icon: '🗺️',
    color: 'bg-blue-50 border-blue-200',
    renderType: 'place',
    endpoint: `${BASE}/TarRlteTarService1`,
    listOperation: 'areaBasedList1',
    extraParams: {
      baseYm: '202504',
      areaCd: '51',       // 강원특별자치도
      signguCd: '51130',  // 원주시
    },
    columns: [
      { key: 'tAtsNm', label: '관광지' },
      { key: 'rlteTatsNm', label: '연관 관광지' },
      { key: 'rlteCtgryLclsNm', label: '분류' },
      { key: 'rlteRank', label: '연관순위' },
    ],
    titleKey: 'tAtsNm',
    subKey: 'rlteTatsNm',
  },
  {
    id: 'durunubi',
    name: '두루누비 여행 서비스',
    nameEn: 'Durunubi Trail',
    description: '전국 걷기길·자전거길 코스 정보 — 거리·소요시간·난이도 제공',
    explainText:
      '행정안전부·한국관광공사가 운영하는 두루누비(durunubi.kr)의 전국 걷기길·자전거길 코스 정보입니다. 코스별 거리(km)·총 소요시간·난이도(하/중/상)·행정구역을 확인할 수 있습니다. 🚶 걷기길과 🚴 자전거길로 구분되며, 여행 전 코스 계획에 활용할 수 있습니다.',
    icon: '🚴',
    color: 'bg-sky-50 border-sky-200',
    renderType: 'course',
    endpoint: `${BASE}/Durunubi`,
    listOperation: 'courseList',
    columns: [
      { key: 'crsKorNm', label: '코스명' },
      { key: 'sigun', label: '지역' },
      { key: 'crsDstnc', label: '거리(km)' },
      { key: 'crsTotlRqrmHour', label: '소요시간' },
      { key: 'crsLevel', label: '난이도' },
      { key: 'brdDiv', label: '구분' },
    ],
    titleKey: 'crsKorNm',
    subKey: 'sigun',
  },
  {
    id: 'english',
    name: '영문 관광정보',
    nameEn: 'English Tourism Info',
    description: '외국인 방문객을 위한 영문 관광지·숙박·음식점 정보',
    explainText:
      'Korea Tourism Organization이 외국인 방문객을 위해 제공하는 영문 관광정보입니다. 관광지·문화시설·숙박·음식점 등의 영문 명칭과 영문 주소, 전화번호를 확인할 수 있습니다. 외국인 지인 안내나 영문 자료 작성 시 활용할 수 있습니다.',
    icon: '🌏',
    color: 'bg-indigo-50 border-indigo-200',
    renderType: 'place',
    endpoint: `${BASE}/EngService2`,
    listOperation: 'areaBasedList2',
    extraParams: {
      arrange: 'C', // 수정일순
    },
    columns: [
      { key: 'title', label: 'Name' },
      { key: 'addr1', label: 'Address' },
      { key: 'tel', label: 'Tel' },
      { key: 'contenttypeid', label: 'Type' },
    ],
    imageKey: 'firstimage2',
    titleKey: 'title',
    addressKey: 'addr1',
  },
  {
    id: 'demand',
    name: '지역별 관광 자원 수요',
    nameEn: 'Regional Tourism Demand',
    description: '지역별 관광 서비스 수요 지표 — SNS 언급량·소비액·내비게이션 검색량',
    explainText:
      '서울시 각 구(區)별 관광 수요를 수치(지수)로 나타낸 통계 데이터입니다. 100에 가까울수록 수요가 높고, 0에 가까울수록 낮습니다. 지표 종류는 ▲SNS 언급량(여행 유형별) ▲카드 소비액(숙박·식음료·쇼핑 등) ▲내비게이션 검색량(숙박·음식·쇼핑) 으로 구성됩니다. — 기준: 서울시 2025년 9월',
    icon: '📊',
    color: 'bg-violet-50 border-violet-200',
    renderType: 'stats',
    endpoint: `${BASE}/AreaTarResDemService`,
    listOperation: 'areaTarSvcDemList',
    extraParams: {
      baseYm: '202509',
      areaCd: '11',
      tarSvcDemIxCd: '11',
    },
    columns: [
      { key: 'tarSvcDemIxNm', label: '지표명' },
      { key: 'areaNm', label: '지역' },
      { key: 'signguNm', label: '시군구' },
      { key: 'tarSvcDemIxVal', label: '수요 지수' },
      { key: 'baseYm', label: '기준 연월' },
    ],
    titleKey: 'tarSvcDemIxNm',
    subKey: 'signguNm',
    valueKey: 'tarSvcDemIxVal',
    valueMax: 100,
  },
]

export function getApiConfig(id: string) {
  return API_CONFIGS.find((c) => c.id === id) ?? null
}

export async function fetchTourismList(
  config: ApiConfig,
  pageNo: number,
  numOfRows = 50,
  signal?: AbortSignal,
): Promise<TourismResponse> {
  if (!SERVICE_KEY) {
    throw new Error('한국관광공사 API 키가 설정되지 않았습니다. (VITE_KTO_SERVICE_KEY)')
  }

  const params = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    MobileOS: 'ETC',
    MobileApp: 'devkdk-portfolio',
    _type: 'json',
    ...config.extraParams,
  })

  const url = `${config.endpoint}/${config.listOperation}?${params.toString()}`
  const res = await fetch(url, { signal })

  if (!res.ok) throw new Error(`API 오류: ${res.status}`)

  const json = await res.json() as unknown
  const body = (json as { response?: { body?: unknown } })?.response?.body
  const bodyObj = body as {
    totalCount?: number
    pageNo?: number
    numOfRows?: number
    items?: { item?: unknown[] | unknown } | string
  } | undefined

  const totalCount = Number(bodyObj?.totalCount ?? 0)
  const rawItems = bodyObj?.items

  let items: Record<string, unknown>[] = []
  if (rawItems && typeof rawItems !== 'string') {
    const item = (rawItems as { item?: unknown }).item
    if (Array.isArray(item)) {
      items = item as Record<string, unknown>[]
    } else if (item && typeof item === 'object') {
      items = [item as Record<string, unknown>]
    }
  }

  return {
    items,
    totalCount,
    pageNo: Number(bodyObj?.pageNo ?? pageNo),
    numOfRows: Number(bodyObj?.numOfRows ?? numOfRows),
  }
}

const CONTENT_TYPE_MAP: Record<string, string> = {
  // 일반 KTO API 타입
  '12': '🏔 관광지',
  '14': '🏛 문화시설',
  '15': '🎉 행사/축제',
  '25': '🗺 여행코스',
  '28': '🏄 레포츠',
  '32': '🏨 숙박',
  '38': '🛍 쇼핑',
  '39': '🍽 음식점',
  // 반려동물 API 타입
  '75': '🏄 레포츠',
  '76': '🏔 관광지',
  '77': '🚌 교통',
  '78': '🏛 문화시설',
  '79': '🛍 쇼핑',
  '80': '🏨 숙박',
  '82': '🍽 음식점',
  '85': '🎉 축제/행사',
}

const WELLNESS_THEME_MAP: Record<string, string> = {
  'EX050100': '🛁 온천/사우나/스파',
  'EX050200': '🔥 찜질방',
  'EX050300': '🌿 한방 체험',
  'EX050400': '🧘 힐링 명상',
  'EX050500': '💆 뷰티 스파',
  'EX050600': '✨ 기타 웰니스',
  'EX050700': '🌲 자연 치유',
}

export function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const str = String(value)
  if (key === 'contenttypeid') return CONTENT_TYPE_MAP[str] ?? str
  if (key === 'wellnessThemaCd') return WELLNESS_THEME_MAP[str] ?? str
  if (key === 'dist') {
    const m = parseFloat(str)
    if (!isNaN(m)) return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
  }
  if (key === 'brdDiv') {
    if (str === 'DNWW') return '🚶 걷기길'
    if (str === 'DNBW') return '🚴 자전거길'
  }
  if (key === 'crsLevel') {
    if (str === '1') return '하'
    if (str === '2') return '중'
    if (str === '3') return '상'
  }
  if (key === 'crsTotlRqrmHour') {
    const min = parseInt(str, 10)
    if (!isNaN(min)) {
      if (min < 60) return `${min}분`
      const h = Math.floor(min / 60)
      const m = min % 60
      return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
    }
  }
  return str
}

/** 수요 지수값(0~100)에 따른 색상 등급 반환 */
export function getDemandLevel(val: number): { label: string; barColor: string; textColor: string } {
  if (val >= 70) return { label: '높음', barColor: 'bg-emerald-500', textColor: 'text-emerald-700' }
  if (val >= 40) return { label: '보통', barColor: 'bg-amber-400', textColor: 'text-amber-700' }
  return { label: '낮음', barColor: 'bg-zinc-300', textColor: 'text-zinc-500' }
}
