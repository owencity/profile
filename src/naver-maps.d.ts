export {}

declare global {
  interface Window {
    naver?: unknown
    navermap_authFailure?: () => void
  }
}

