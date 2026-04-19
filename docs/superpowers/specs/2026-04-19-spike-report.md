# 原生能力 Spike 报告

> 状态：**待开发者真机验证并填写结果**。代码层面的 Spike 页已就绪（见 `pages/spike/index.uvue`），真机跑一次后按下面表格回填。

- 日期：2026-04-19
- 真机型号：<填写>
- 鸿蒙版本：<填写>
- uni-app x 版本：<填写>

## 结果

| 能力 | API | 结果 | 备注 |
|---|---|---|---|
| 振动（短/长） | `uni.vibrateShort` / `uni.vibrateLong` | ✅ / ❌ | 需要 `ohos.permission.VIBRATE`（已声明） |
| 音效播放 | `uni.createInnerAudioContext` | ✅ / ❌ | 首次播放延迟：<ms>。需先放入 `static/sound/click.mp3`（CC0，100-300ms） |
| 加速度传感器 | `uni.startAccelerometer` / `uni.onAccelerometerChange` | ✅ / ❌ | 3 秒采样次数 / 峰值 |
| 多指触控 | UVue touchstart/move/end | ✅ / ❌ | 峰值触点数 |

## 操作指引（开发者真机验证）

1. 准备一段 100-300ms 的短按钮音效（CC0 许可），重命名为 `click.mp3` 放入 `static/sound/`。
2. 在 HBuilderX 中 `运行 → 运行到手机或模拟器 → 鸿蒙`，首次启动进入 Spike 页。
3. 依次点击 4 个按钮 / 在触控区多指按压；观察日志与触点数，回填上表。
4. 若某项 ❌，记录错误详情并暂停，讨论用 UTS 插件或原生 ArkTS 模块替代。

## 结论

- 进入 Phase 1：<是 / 否>
- 如有失败项，替代方案：<写 UTS 插件 / 原生 ArkTS 模块>
