import type { ComponentType } from 'react'
import VendingMachinePage, {
  VENDING_MACHINE_BLURB,
  VENDING_MACHINE_OBJECT_SRC,
  VENDING_MACHINE_TITLE,
} from './vending-machine/VendingMachinePage.tsx'

/**
 * B1 — 작품 등록 계약. 작품 등록의 단일 진실.
 * 작품 추가 = 여기 항목 하나 + `src/works/<slug>/` 폴더 하나 +
 * `public/works/<slug>/` 에셋 폴더 하나. 그 밖의 코드는 손대지 않는다.
 */

/** v1의 유일한 오브제 표현. `src`는 `/works/<slug>/`로 시작하는 사이트 상대 경로. */
export interface ImageObject {
  type: 'image'
  src: string
}

/** 판별 유니온 — 미래의 `{ type: 'model', ... }` 등은 항목 수준에서 교체된다. */
export type WorkObject = ImageObject

export interface WorkEntry {
  /** `[a-z0-9-]+` 형식, 유일. 라우트 `/works/<slug>`가 된다. */
  slug: string
  /** 방울 라벨과 페이지에 쓰인다. */
  title: string
  /** 한 줄 소개. */
  blurb: string
  object: WorkObject
  /** `/works/<slug>`에 마운트. 렌더 결과에 홈(`/`) 링크가 있어야 한다. */
  Page: ComponentType
}

/** 등록 항목의 라우트 경로 (`/works/<slug>`) — 라우팅 표면과 링크가 함께 쓴다. */
export function workPath(slug: string): string {
  return `/works/${slug}`
}

export const works: readonly WorkEntry[] = [
  {
    slug: 'vending-machine',
    title: VENDING_MACHINE_TITLE,
    blurb: VENDING_MACHINE_BLURB,
    object: { type: 'image', src: VENDING_MACHINE_OBJECT_SRC },
    Page: VendingMachinePage,
  },
]
