# practice-3d

3D 연습장. Blender로 만든 것들을 웹에서 보여주는 포트폴리오 사이트.

메인 페이지에서 비눗방울들이 떠오르고, 라벨이 달린 방울을 클릭하면 터지면서
해당 작품 페이지로 이동한다.

## 스택

- **사이트**: Vite + React + TypeScript + React Three Fiber(three.js) + drei + GSAP + react-router
- **3D 제작**: Blender 5.2 (원본은 `blender/`, 씬 설명은 각 작품 페이지 참고)

## 개발

```bash
npm install
npm run dev   # http://localhost:5173
```

## 작품 추가하는 법

1. `src/works.ts`에 항목 추가 → 메인 씬에 라벨 달린 방울이 하나 늘어난다
2. `src/pages/`에 작품 페이지 컴포넌트 추가, `src/App.tsx`에 라우트 연결
3. 웹용 에셋(webp/mp4)은 `public/works/<slug>/`에

## 구조

- `src/scenes/` — R3F 방울 씬 (Bubble: 부유/호버/터짐, Burst: 파티클)
- `src/pages/` — 홈 + 작품 페이지
- `blender/` — .blend 원본
- `renders/` — 렌더 산출물 (gitignore, 웹용 사본만 `public/`에)
