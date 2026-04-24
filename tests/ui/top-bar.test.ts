import { describe, expect, it } from 'vitest'
import { getTopBarPaddingStyle } from '@/ui/top-bar'

describe('top bar safe area', () => {
  it('顶部栏上边距叠加真机安全区高度', () => {
    expect(getTopBarPaddingStyle({
      statusBarHeight: 24,
      safeAreaTop: 32
    })).toEqual({
      paddingTop: '46px',
      paddingRight: '20px',
      paddingBottom: '14px',
      paddingLeft: '20px'
    })
  })

  it('没有安全区信息时保留基础内边距', () => {
    expect(getTopBarPaddingStyle()).toEqual({
      paddingTop: '14px',
      paddingRight: '20px',
      paddingBottom: '14px',
      paddingLeft: '20px'
    })
  })
})
