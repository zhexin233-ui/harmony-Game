// utils/game-sounds.ts
// 所有游戏共享的音效 ID → 相对路径映射。
// 文件不存在时，native/audio.ts 会静默降级。

export const GAME_SOUNDS: Record<string, string> = {
  click:     '/static/sound/click.mp3',
  tick:      '/static/sound/tick.mp3',
  explode:   '/static/sound/explode.mp3',
  bite:      '/static/sound/bite.mp3',
  signal:    '/static/sound/signal.mp3',
  countdown: '/static/sound/countdown.mp3',
  win:       '/static/sound/win.mp3',
  lose:      '/static/sound/lose.mp3'
}
