import './style.scss'
import * as Locale from './locales/lang.en.json'
import { debounce, I18n, path, Plugin, PluginSettings } from '@typora-community-plugin/core'
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

  i18n = new I18n<typeof Locale>({
    localePath: path.join(this.manifest.dir!, 'locales')
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
      this.store.on('tag:change', debounce(() =>
        this.settings.set('tags', this.store.toArray()), 1e3)))

    this.register(
      this.app.metadata.on('index:done', () => {
        Object.keys(this.app.metadata.cache).forEach(key =>
          this._addFrontMatterTagsToStore(key))
      }))
    this.register(
      this.app.metadata.on('index:update', (filePath) =>
        this._addFrontMatterTagsToStore(filePath)))

    this.register(
      this.app.workspace.on('file:open', (filePath) => {
        const relativePath = path.relative(this.app.vault.path, filePath)
        this._addFrontMatterTagsToStore(relativePath)
      }))

    this.addChild(new TagRenderer(this))
    this.addChild(new TagStyleToggler(this))
    this.addChild(new UseSuggest(this.app, this))

    this.registerSettingTab(new TagSettingTab(this))
  }

  private _addFrontMatterTagsToStore(filePath: string) {
    const { cache } = this.app.metadata
    let tags = cache[filePath]?.metadata?.frontmatter?.tags as string | string[]
    if (Array.isArray(tags)) this.store.bulkAdd(tags.map(t => '#' + t))
  }
}
