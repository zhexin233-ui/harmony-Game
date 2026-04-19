# 游戏音效资源

所有音效为 **CC0 / CC-BY** 许可，可免费用于商业项目。

| 文件 | 用途 | 时长建议 | 推荐来源（freesound.org / pixabay） |
|---|---|---|---|
| `click.mp3`     | 所有按钮点击、剪引线、鳄鱼无害牙 | 80–200 ms | 搜索 "UI click" / "button tap" |
| `tick.mp3`      | 炸弹滴答（按剩余时间频率递增） | 60–150 ms | 搜索 "clock tick" / "bomb tick" |
| `explode.mp3`   | 炸弹爆炸、结算页敲定输家冲击 | 500–1200 ms | 搜索 "cartoon explosion" |
| `bite.mp3`      | 鳄鱼陷阱牙咬合 | 300–600 ms | 搜索 "chomp" / "bite" |
| `signal.mp3`    | 反应游戏发出信号、摇马开始 | 150–300 ms | 搜索 "game signal" / "beep" |
| `countdown.mp3` | 摇马倒计时 3/2/1 提示 | 80–200 ms | 搜索 "countdown beep" |
| `win.mp3`       | 摇马结算赢家 | 500–900 ms | 搜索 "win jingle" |
| `lose.mp3`      | 结算/失败提示 | 400–900 ms | 搜索 "fail sound" / "lose trumpet" |

## 规范

- 采样率 44.1kHz / 比特率 ≥128kbps。
- 文件体积 ≤200KB（鸿蒙启动预加载 8 个文件总体积 <2MB）。
- 文件名必须与 `utils/game-sounds.ts` 的映射严格对应。

## 加入新文件

1. 从 freesound.org 下载 CC0 文件（登录后勾选 "Creative Commons 0"）。
2. 用 ffmpeg 转码到 mp3：`ffmpeg -i input.wav -b:a 128k -ar 44100 static/sound/<name>.mp3`。
3. 在本表里补一行注明 **原始 URL** 与 **作者**。
