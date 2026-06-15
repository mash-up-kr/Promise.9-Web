/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // 테스트가 아직 없는 초기 상태에서 `pnpm test` 가 실패하지 않도록.
  passWithNoTests: true,
};
