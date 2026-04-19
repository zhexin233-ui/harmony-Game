// Vitest 运行期的占位全局声明：只为通过 TS 类型检查，运行时由 tests/setup.ts 注入实际 mock。
// 真机构建由 uni-app x 自身的类型（@dcloudio/types）提供，不走此文件。
declare const uni: any
