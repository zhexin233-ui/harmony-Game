# SVG 图标统一与底部导航收敛设计

## 目标

- 移除底部导航中的“游戏”按钮，仅保留“首页 / 惩罚 / 设置”。
- 将运行时代码中的 emoji / 文本图标替换为 SVG 资源。
- 不修改业务流程，不处理 `docs/` 与 `ui 设计/` 下的历史说明和设计稿。

## 方案

### 1. 图标资源与组件

- 在 `static/icons/` 下新增 SVG 资源。
- 新增 `ui/icons.ts` 维护图标 key 与 `/static/icons/*.svg` 的映射。
- 新增 `components/UiIcon.uvue` 统一渲染图标尺寸、容器和图片模式。

### 2. 导航收敛

- `ui/navigation.ts` 删除 `games` 导航项，保留 `home / punishment / settings`。
- `BottomNavBar.uvue` 改为使用 `UiIcon` 渲染 SVG 图标。
- `BottomNavBar` 的 `active` 允许为空，供游戏列表页展示三项底栏但不高亮任何项。

### 3. 全局图标替换范围

- 顶部栏：返回、首页、设置、首页右上角入口。
- 首页：开始、惩罚、设置、箭头。
- 惩罚页：新增、空态。
- 游戏列表：分组图标、封面加载失败降级图标。
- 主题卡片：主题图标和选中态。
- 结果页与具体游戏页：原本作为视觉图标展示的 emoji。

## 兼容性结论

- 采用 `uni-app x` 官方支持的 `image` 组件加载 `/static/*.svg` 资源。
- 不使用 SVG 动画。

## 验证

- 先改 `tests/ui/navigation.test.ts`、`tests/ui/games.test.ts`、`tests/ui/theme-cards.test.ts` 表达新行为。
- 运行定向测试确认失败后实现。
- 最终运行 `pnpm test` 与 `pnpm exec tsc --noEmit --ignoreDeprecations 6.0`。
- 检索运行时代码，确认不再残留 emoji 图标。
