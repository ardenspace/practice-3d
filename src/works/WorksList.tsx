import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  backdropStyle,
  siteHeaderStyle,
  siteTaglineStyle,
  siteTitleStyle,
} from '../siteStyles.ts'
import {
  COLOR_ACCENT_CYAN,
  COLOR_CARD_EDGE,
  COLOR_CARD_SURFACE,
  COLOR_NEBULA_PURPLE,
  COLOR_SLIDE_EDGE,
  COLOR_SLIDE_SHADOW,
  COLOR_SLIDE_SURFACE,
  COLOR_TEXT,
  SITE_TAGLINE,
  SITE_TITLE,
  SLIDE_ENTER_ANIMATION,
  WORKS_DISMISS_TESTID,
  WORKS_EMPTY_MESSAGE,
  WORKS_LIST_LABEL,
  WORKS_TESTID,
  Z_ABOVE_SCENE,
  Z_SLIDE,
  workObjectAlt,
} from '../theme.ts'
import { workPath, works, type WorkEntry } from './registry.ts'

// B5 — 작품 목록 표면. 작품 목록을 그리는 곳은 온 사이트에 하나이고,
// 그 하나가 두 가지 모습(슬라이드 / 전체 화면)으로 나타난다.
//
// 표현 분기는 컴포넌트 바깥에서 `variant`로 받는다. 그래야 방울 씬을
// 마운트하지 않고도 두 모습을 각각 렌더해 확인할 수 있다 — jsdom에는
// WebGL이 없고, 있다고 속이면 R3F 캔버스가 실제로 마운트되어 죽는다.
//
// 항목의 내용은 전부 등록부(B1)에서 파생된다: 오브제 이미지, 제목,
// 한 줄 소개, `/works/<slug>`를 가리키는 진짜 링크. 등록부에 항목을 하나
// 더하면 다른 코드를 고치지 않아도 여기 나타난다 (Requirement 25).
//
// 슬라이드는 씬 위에 열리는 "창"이다. 창 바깥은 목록이 아니라 목록을 닫는
// 면이고, 그 면을 이 컴포넌트가 함께 그린다 (Requirement 19). 닫는 방법
// 자체 — 히스토리를 되감을지 홈으로 갈아칠지 — 는 여기 없다. 목록은 자기가
// 닫혀야 한다는 사실만 `onDismiss`로 알리고, 주소를 아는 쪽이 그것을 맡는다.
// 전체 화면은 닫히는 물건이 아니라 머무는 자리이므로 이 면이 아예 없다
// (Requirement 22).
//
// 이 스텝 밖: 키보드 순회와 Esc, 보조기술 알림 층.

/**
 * 목록이 나타나는 두 모습.
 * - `slide`: 방울 씬 위에 창처럼 열린다. 제목·태그라인은 홈이 이미
 *   그리므로 목록이 다시 그리지 않는다.
 * - `fullscreen`: 씬을 띄울 수 없는 방문자의 홈. 사이트 제목과 태그라인을
 *   함께 이고 있다.
 */
export type WorksListVariant = 'slide' | 'fullscreen'

export interface WorksListProps {
  variant: WorksListVariant
  /**
   * 그릴 항목들. 기본값은 등록부(`works`) 전체 — 목록의 내용은 전부 B1에서
   * 파생된다. 주입은 빈 등록부 같은 경계를 씬 없이 확인하기 위한 seam이다.
   */
  entries?: readonly WorkEntry[]
  /**
   * 슬라이드 바깥이 눌렸다 — 목록이 닫혀야 한다 (Requirement 19). 무엇을
   * 해서 닫을지는 이 컴포넌트가 모른다.
   *
   * `fullscreen`에서는 무시된다. 그 화면은 닫히는 물건이 아니므로 바깥을
   * 눌러도 아무 일이 없어야 하고, 애초에 눌릴 바깥 면을 그리지 않는다
   * (Requirement 22).
   */
  onDismiss?: () => void
}

// ─── 두 모습이 공유하는 조각 ────────────────────────────────────────────

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  width: '100%',
  display: 'grid',
  gap: '1.25rem',
}

// 카드 전체가 링크다 — 이미지든 제목이든 어디를 눌러도 그 작품으로 간다.
const cardLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  height: '100%',
  padding: '1rem',
  borderRadius: '1rem',
  border: `1px solid ${COLOR_CARD_EDGE}`,
  background: COLOR_CARD_SURFACE,
  color: COLOR_TEXT,
  textDecoration: 'none',
}

// 오브제 자리. 이미지가 실패해도 이 틀은 남으므로 카드가 무너지지 않는다.
const objetFrameStyle: CSSProperties = {
  display: 'block',
  aspectRatio: '4 / 3',
  borderRadius: '0.75rem',
  overflow: 'hidden',
  background: `radial-gradient(circle at 50% 45%, ${COLOR_SLIDE_EDGE}, transparent 70%)`,
}

const objetImageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.0625rem',
  fontWeight: 400,
  letterSpacing: '0.1em',
  color: COLOR_ACCENT_CYAN,
  textShadow: `0 0 18px ${COLOR_NEBULA_PURPLE}`,
}

const cardBlurbStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: 1.6,
  fontWeight: 300,
  opacity: 0.78,
}

const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9375rem',
  fontWeight: 300,
  letterSpacing: '0.14em',
  opacity: 0.72,
  textAlign: 'center',
}

// ─── 슬라이드: 씬 위에 열리는 창 ────────────────────────────────────────

// 슬라이드 바깥 — 씬을 덮는 투명한 면. 목록이 열려 있는 동안 씬으로 가던
// 마우스는 전부 여기서 멎고(방울은 뒤에서 계속 떠다니지만 만질 수 없다),
// 여기를 누르면 목록이 닫힌다. 색을 입히지 않는 이유는 뒤의 방울이 그대로
// 보여야 하기 때문이고, 커서를 되돌려 두는 이유는 방울 위에서 목록을 열면
// 손가락 커서가 그대로 굳어 보이기 때문이다.
const dismissSurfaceStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  cursor: 'default',
  zIndex: Z_ABOVE_SCENE,
}

const slideRootStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 'min(26rem, 100%)',
  // 항목이 화면보다 많으면 창 안에서 스크롤된다 (Requirement 18).
  // overscroll-behavior로 그 스크롤이 뒤 화면으로 넘어가지 않게 가둔다.
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  zIndex: Z_SLIDE,
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '2.5rem 1.5rem calc(2.5rem + env(safe-area-inset-bottom, 0px))',
  background: COLOR_SLIDE_SURFACE,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderLeft: `1px solid ${COLOR_SLIDE_EDGE}`,
  boxShadow: `0 0 60px ${COLOR_SLIDE_SHADOW}`,
  color: COLOR_TEXT,
  animation: SLIDE_ENTER_ANIMATION,
}

const slideListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: '1fr',
}

// ─── 전체 화면: 씬을 띄울 수 없는 방문자의 홈 ───────────────────────────

const fullscreenRootStyle: CSSProperties = {
  ...backdropStyle,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3rem',
  padding: '4rem 1.5rem',
}

const fullscreenBodyStyle: CSSProperties = {
  width: '100%',
  maxWidth: '56rem',
}

const fullscreenListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
}

// ─── 항목 ───────────────────────────────────────────────────────────────

function WorkCard({ entry }: { entry: WorkEntry }) {
  // 오브제 이미지가 이 화면에서 처음으로 DOM 이미지로 요청된다. 못 불러오면
  // 이미지만 접고 제목과 소개는 남긴다 — 빈 자리만 남는 카드를 두지 않는다
  // (Requirement 28).
  const [objetFailed, setObjetFailed] = useState(false)
  const description = workObjectAlt(entry.title, entry.blurb)

  return (
    <li>
      {/* aria-label로 링크 이름을 한 구절로 고정한다 — 이미지 alt와 카드
          본문이 이어 붙어 장황하게 읽히는 것을 막는다. */}
      <Link
        to={workPath(entry.slug)}
        aria-label={description}
        style={cardLinkStyle}
      >
        <span style={objetFrameStyle}>
          {!objetFailed && (
            <img
              src={entry.object.src}
              alt={description}
              style={objetImageStyle}
              onError={() => setObjetFailed(true)}
            />
          )}
        </span>
        <span style={cardTitleStyle}>{entry.title}</span>
        <span style={cardBlurbStyle}>{entry.blurb}</span>
      </Link>
    </li>
  )
}

export default function WorksList({
  variant,
  entries = works,
  onDismiss,
}: WorksListProps) {
  const fullscreen = variant === 'fullscreen'

  const body =
    entries.length === 0 ? (
      // 등록부가 비면 목록 자리에 문구 하나 (Requirement 29).
      <p style={emptyStyle}>{WORKS_EMPTY_MESSAGE}</p>
    ) : (
      <ul style={fullscreen ? fullscreenListStyle : slideListStyle}>
        {entries.map((entry) => (
          <WorkCard key={entry.slug} entry={entry} />
        ))}
      </ul>
    )

  // 전체 화면은 그 방문자의 홈 자체라 main 랜드마크를 이고 있고, 슬라이드는
  // 홈 위에 얹히는 창이라 이름 붙은 영역이다.
  if (!fullscreen) {
    return (
      <>
        {/* 창 바깥. 보조기술에는 목록만 있으면 되므로 이 면은 숨긴다 —
            키보드로 목록을 닫는 길(Esc)은 페이즈 3이 따로 낸다. */}
        {onDismiss && (
          <div
            data-testid={WORKS_DISMISS_TESTID}
            aria-hidden="true"
            style={dismissSurfaceStyle}
            onClick={onDismiss}
          />
        )}
        <section
          data-testid={WORKS_TESTID}
          data-variant={variant}
          aria-label={WORKS_LIST_LABEL}
          style={slideRootStyle}
        >
          {body}
        </section>
      </>
    )
  }

  // 사이트 제목과 태그라인은 화면에 한 번만 나온다 (Requirement 30). 씬 홈이
  // 그리고 있으면(=슬라이드) 목록은 그리지 않고, 씬 홈이 없으면(=전체 화면)
  // 목록이 그린다. 규칙이 하나뿐이라 제목이 둘이 되거나 사라지지 않는다.
  return (
    <main
      data-testid={WORKS_TESTID}
      data-variant={variant}
      style={fullscreenRootStyle}
    >
      <header style={siteHeaderStyle}>
        <h1 style={siteTitleStyle}>{SITE_TITLE}</h1>
        <p style={siteTaglineStyle}>{SITE_TAGLINE}</p>
      </header>
      <section aria-label={WORKS_LIST_LABEL} style={fullscreenBodyStyle}>
        {body}
      </section>
    </main>
  )
}
