import { I18n, Plugin, PluginSettings } from '@typora-community-plugin/core'
import { TagStore } from './store'
import { TagRenderer } from './features/tag-renderer'
import { TagStyleToggler } from './features/style-toggler'
import { UseSuggest } from './features/use-sugguest'
import { TagSettingTab } from './setting-tab'


interface TagSettings {
  useSuggest: boolean
}

const DEFAULT_SETTINGS: TagSettings = {
  useSuggest: false,
}

export default class TagPlugin extends Plugin<TagSettings> {

  i18n = new I18n({
    resources: {
      'en': {
        toggleTag: 'Toggle Focused/Selected Text Tag Style',
        useSuggest: {
          name: 'Use suggestion',
          desc: 'Input text prefix `#` to trigger tag suggestions.'
        },
      },
      'zh-cn': {
        toggleTag: '切换标签样式',
        useSuggest: {
          name: '输入建议',
          desc: '输入触发字符 `#` 触发标签建议。'
        },
      },
    }
  })

  store = new TagStore()

  onload() {

    this.registerSettings(
      new PluginSettings(this.app, this.manifest, {
        version: 1,
      }))

    this.settings.setDefault(DEFAULT_SETTINGS)


    this.addChild(new TagRenderer(this))
    this.addChild(new TagStyleToggler(this))
    this.addChild(new UseSuggest(this.app, this))

    this.registerSettingTab(new TagSettingTab(this))
  }
}
