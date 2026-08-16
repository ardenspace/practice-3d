// WebGL 가용성 프로브 (B4). R3F <Canvas>를 마운트하기 *전에* 호출한다 —
// three.js가 컨텍스트 획득에 실패하며 던지는 예외/백지 화면을 피하고,
// jsdom(WebGL 없음)에서는 Canvas가 아예 마운트되지 않게 보장한다.
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return context !== null
  } catch {
    return false
  }
}
