export type Work = {
  slug: string
  title: string
  blurb: string
}

// 작품이 생길 때마다 여기에 하나 추가하면 메인 씬에 라벨 달린 방울이 하나 늘어난다.
export const works: Work[] = [
  {
    slug: 'bubbles-space',
    title: 'Bubbles in Space',
    blurb: 'Blender 연습 — 우주를 떠다니다 터지는 비눗방울',
  },
]
