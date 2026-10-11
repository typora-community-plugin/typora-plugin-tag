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

const RE_INLINE_TAG = /(^|\s)(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)/g

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
      this.app.metadata.register('md', async (ctx) => {
        const tags: { name: string; lineText: string; lineNumber: number }[] = []
        let inFrontMatter = false
        let inFence = false
        const lines = (await ctx.text()).split(/\r\n|\r|\n/)
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index]
          const trimmed = line.trim()
          if (trimmed === '---' && (index === 0 || inFrontMatter)) {
            inFrontMatter = !inFrontMatter
            continue
          }
          if (inFrontMatter) continue
          if (/^(```|~~~)/.test(trimmed)) {
            inFence = !inFence
            continue
          }
          if (inFence) continue
          for (const match of line.match(RE_INLINE_TAG) ?? []) {
            tags.push({
              name: match.trim().slice(1),
              lineText: trimmed,
              lineNumber: index + 1,
            })
          }
        }
        return { metadata: { tags } }
      }, { merge: { 'metadata.tags': 'concatUnique' } }))

    this.register(
      this.app.metadata.on('index:done', () => {
        Object.keys(this.app.metadata.cache).forEach(key =>
          this._addTagsToStore(key))
      }))
    this.register(
      this.app.metadata.on('index:update', (filePath) =>
        this._addTagsToStore(filePath)))

    this.register(
      this.app.workspace.on('file:open', (filePath) => {
        const relativePath = path.relative(this.app.vault.path, filePath)
        this._addTagsToStore(relativePath)
      }))

    this.addChild(new TagRenderer(this))
    this.addChild(new TagStyleToggler(this))
    this.addChild(new UseSuggest(this.app, this))

    this.registerSettingTab(new TagSettingTab(this))
  }

  private _addTagsToStore(filePath: string) {
    const { cache } = this.app.metadata
    const tags = cache[filePath]?.metadata?.tags
    if (Array.isArray(tags)) {
      this.store.bulkAdd(tags.map(t => '#' + t.name.replace(/^#+/, '')))
    }
  }
}
