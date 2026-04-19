// data/builtin-punishments.ts
// Spec §4.3 的 25 条内置惩罚。
// 原 Spec 写的是 .json，改为 .ts 的原因：UVue/UTS 对原始 JSON 导入支持不稳定，
// 而本仓库 tsconfig 的 include 已包含 data/**/*.ts，两端（UVue 运行时 + Vitest）一视同仁。

export const BUILTIN_PUNISHMENTS: Array<{
  id: string
  text: string
  builtIn: boolean
  enabled: boolean
}> = [
  { id: 'builtin-01', text: '学三声狗叫', builtIn: true, enabled: true },
  { id: 'builtin-02', text: '表演一段绕口令', builtIn: true, enabled: true },
  { id: 'builtin-03', text: '做 5 个俯卧撑', builtIn: true, enabled: true },
  { id: 'builtin-04', text: '向全桌敬酒一杯（可换饮料）', builtIn: true, enabled: true },
  { id: 'builtin-05', text: '唱一首歌的副歌', builtIn: true, enabled: true },
  { id: 'builtin-06', text: '模仿一位明星说话 10 秒', builtIn: true, enabled: true },
  { id: 'builtin-07', text: '讲一个冷笑话', builtIn: true, enabled: true },
  { id: 'builtin-08', text: '做 10 个深蹲', builtIn: true, enabled: true },
  { id: 'builtin-09', text: '跳 20 秒开合跳', builtIn: true, enabled: true },
  { id: 'builtin-10', text: '保持微笑 30 秒，不许出声', builtIn: true, enabled: true },
  { id: 'builtin-11', text: '用反手在纸上写自己名字', builtIn: true, enabled: true },
  { id: 'builtin-12', text: '模仿一个动物走路 10 秒', builtIn: true, enabled: true },
  { id: 'builtin-13', text: '给下家揉 30 秒肩膀', builtIn: true, enabled: true },
  { id: 'builtin-14', text: '本局起担任记分员 1 轮', builtIn: true, enabled: true },
  { id: 'builtin-15', text: '说出 5 种水果的英文名', builtIn: true, enabled: true },
  { id: 'builtin-16', text: '讲一段最近发生的糗事', builtIn: true, enabled: true },
  { id: 'builtin-17', text: '原地闭眼转三圈后走一条直线', builtIn: true, enabled: true },
  { id: 'builtin-18', text: '表演 15 秒鬼畜舞蹈', builtIn: true, enabled: true },
  { id: 'builtin-19', text: '学婴儿哭 5 秒', builtIn: true, enabled: true },
  { id: 'builtin-20', text: '下一局开始前大喊三次「我一定赢」', builtIn: true, enabled: true },
  { id: 'builtin-21', text: '给在场任意一位玩家一句真心夸奖', builtIn: true, enabled: true },
  { id: 'builtin-22', text: '下一轮只能用「嗯」「啊」回答', builtIn: true, enabled: true },
  { id: 'builtin-23', text: '模仿一段广告词', builtIn: true, enabled: true },
  { id: 'builtin-24', text: '单腿站立 15 秒', builtIn: true, enabled: true },
  { id: 'builtin-25', text: '朗读下家最近一条朋友圈（不涉及隐私）', builtIn: true, enabled: true }
]
