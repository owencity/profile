export type TourismApiId =
  | 'wellness'
  | 'pet'
  | 'related'
  | 'durunubi'
  | 'english'
  | 'demand'

export type ColumnDef = {
  key: string
  label: string
  className?: string
}

// 'stats'  : 수치 지표 중심 (지수값 + 프로그레스 바)
// 'place'  : 장소 정보 중심 (이미지 + 주소 + 태그)
// 'course' : 코스/경로 중심 (거리·난이도·테마)
export type RenderType = 'stats' | 'place' | 'course'

export type ApiConfig = {
  id: TourismApiId
  name: string
  nameEn: string
  description: string
  /** 페이지 상단에 표시할 이 API 데이터의 의미 설명 */
  explainText: string
  icon: string
  color: string
  renderType: RenderType
  endpoint: string
  listOperation: string
  extraParams?: Record<string, string>
  columns: ColumnDef[]
  imageKey?: string
  titleKey: string
  subKey?: string
  addressKey?: string
  /** renderType='stats' 일 때 수치를 나타내는 필드 */
  valueKey?: string
  /** renderType='stats' 일 때 수치의 최대값 (프로그레스 바 기준) */
  valueMax?: number
}

export type TourismItem = Record<string, unknown>

export type TourismResponse = {
  items: TourismItem[]
  totalCount: number
  pageNo: number
  numOfRows: number
}
