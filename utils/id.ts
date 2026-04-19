// utils/id.ts
// 为自定义惩罚规则生成本地 ID。UVue 环境下无 crypto.randomUUID，
// 用时间戳 + 6 位 36 进制随机足够避免单设备碰撞。

export function generateCustomId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.floor(Math.random() * 1e12).toString(36).slice(0, 6).padStart(6, '0')
  return `custom-${ts}-${rand}`
}
