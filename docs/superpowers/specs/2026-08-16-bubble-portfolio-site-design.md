# practice-3d 포트폴리오 사이트 — 비눗방울 인터랙션 (2026-08-16)

## 목적

3D 연습 결과물을 모아두는 포트폴리오 사이트. 메인 페이지에서 비눗방울들이
떠오르고, 방울을 클릭하면 터지면서 해당 작품 페이지로 이동한다.
작품이 생길 때마다 방울 하나 + `/works/<이름>` 페이지 하나를 추가하는 구조.

## 스택

Vite + React + TypeScript + React Three Fiber(three.js) + drei + GSAP +
react-router. 빌드/배포는 우선 로컬 `npm run dev`, GitHub Pages는 추후.
원격: https://github.com/ardenspace/practice-3d.git (main 브랜치).

## 구조

- 레포 루트 = Vite 앱. `src/` 아래 씬/페이지 컴포넌트.
- 라우트: `/` = 방울 씬, `/works/bubbles-space` = 첫 작품 갤러리
  (Blender로 만든 영상 2개 + 스틸).
- `blender/` = 원본 .blend 및 애드온 파일. `renders/`(PNG 시퀀스 등 무거운
  산출물)는 gitignore, 웹용 에셋만 `public/works/`에 복사.

## 메인 씬

- R3F 캔버스에 방울 ~15개. `MeshPhysicalMaterial`의 iridescence +
  transmission으로 비눗방울 재질 (three.js 내장 박막 간섭).
- 방울은 아래→위로 떠오르고 화면 밖으로 나가면 아래에서 리스폰. 사인파 흔들림.
- 배경: Blender 씬에서 방울을 숨기고 성운만 렌더한 이미지 한 장.
- 작품에 연결된 방울은 라벨 표시, 나머지는 장식용.

## 터짐 인터랙션

호버 시 살짝 확대. 클릭 시 GSAP 타임라인: 순간 팽창 → 메시 숨김 + 물방울
파티클 ~40개 방사(InstancedMesh) → 약 0.5초 뒤 라우팅.

## 검증

`npm run dev` 후 헤드리스 브라우저로 렌더/클릭/라우팅 확인, 스크린샷 검수.
