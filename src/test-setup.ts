// Vitest 셋업 (테스트 환경 보정 전용 — 앱 코드 아님).
//
// jsdom은 자체 AbortController/AbortSignal을 전역에 올리지만, Node의
// fetch/Request(undici)는 자기 렐름의 AbortSignal만 받는다. react-router 7
// 데이터 라우터는 내비게이션(<Navigate> 리다이렉트 포함)마다
// `new Request(url, { signal })`을 만들기 때문에, jsdom 시그널이 들어가면
// "Expected signal to be an instance of AbortSignal"로 내비게이션이 죽는다.
// Node 네이티브 클래스를 전역에 복원해 렐름을 일치시킨다.
import { transferableAbortController } from 'node:util'

const nativeController = transferableAbortController()
globalThis.AbortController =
  nativeController.constructor as typeof AbortController
globalThis.AbortSignal =
  nativeController.signal.constructor as typeof AbortSignal
