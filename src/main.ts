import * as _ from 'lodash'
import { I18n, Plugin, PluginSettings } from '@typora-community-plugin/core'
import { TagStore } from './store'
import { TagRenderer } from './features/tag-renderer'
import { TagStyleToggler } from './features/style-toggler'
import { UseSuggest } from './features/use-sugguest'
import { TagSettingTab } from './setting-tab'


interface TagSettings {
  useSuggest: boolean
  tags: string[]
}

const DEFAULT_SETTINGS: TagSettings = {
  useSuggest: false,
  tags: [],
}

export default class TagPlugin extends Plugin<TagSettings> {

  i18n = new I18n({
    resources: {
      'en': {
        toggleTag: 'Toggle Focused/Selected Text Tag Style',
        ribbonTags: 'Tags',
        useSuggest: {
          name: 'Use suggestion',
          desc: 'Input text prefix `#` to trigger tag suggestions.'
        },
      },
      'zh-cn': {
        toggleTag: '切换标签样式',
        ribbonTags: '标签',
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

    this.store.bulkAdd(this.settings.get('tags'))

    this.register(
      this.store.on('change', _.debounce(() =>
        this.settings.set('tags', this.store.toArray()), 1e3)))


    this.addChild(new TagRenderer(this))
    this.addChild(new TagStyleToggler(this))
    this.addChild(new UseSuggest(this.app, this))

    this.registerSettingTab(new TagSettingTab(this))
  }
}
