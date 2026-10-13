import './style.scss'
import * as Locale from './locales/lang.en.json'
import { I18n, path, Plugin, PluginSettings } from '@typora-community-plugin/core'
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

const migrations = {
  hasMigrated: false,
  migrate(settings: any) {
    if (settings.version < 2) {
      settings.migrateTo(2, ({ settings: data }: any) => {
        delete data.tags
        return { version: 2, settings: data }
      })
      this.hasMigrated = true
    }
  },
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
        version: 2,
        migrations: migrations as any,
      }))

    this.settings.setDefault(DEFAULT_SETTINGS)

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
      }, { merge: { 'metadata.tags': 'concat' } }))

    this.register(
      this.app.metadata.on('index:done', () => this._rebuildTagStore()))

    this.register(
      this.app.metadata.on('index:update', (relativePath) =>
        this.store.setFileTags(
          relativePath, this._tagNames(this.app.metadata.cache[relativePath]))))

    this.register(
      this.app.workspace.on('file:open', (filePath) =>
        this._updateFileTags(filePath)))

    this.register(
      this.app.metadata.on('index:remove', (relativePath) =>
        this.store.removeFiles(relativePath)))

    // The internal metadata plugin is disabled by default, so nothing triggers
    // `metadata.index()`. Kick it off ourselves (after registering the provider)
    // so the cache is built with our provider included.
    this.app.metadata.index().catch(() => { })

    this.addChild(new TagRenderer(this))
    this.addChild(new TagStyleToggler(this))
    this.addChild(new UseSuggest(this.app, this))

    this.registerSettingTab(new TagSettingTab(this))
  }

  /** Tag names in one file, one entry per occurrence (duplicates kept). */
  private _tagNames(entry: { metadata?: { tags?: unknown } } | undefined): string[] {
    const tags = entry?.metadata?.tags
    if (!Array.isArray(tags)) return []

    const names: string[] = []
    for (const tag of tags) {
      const name = '#' + String((tag as any)?.name ?? '').replace(/^#+/, '')
      if (name !== '#') names.push(name)
    }
    return names
  }

  private _updateFileTags(filePath: string) {
    const relativePath = path.relative(this.app.vault.path, filePath)
    this.store.setFileTags(
      relativePath,
      this._tagNames(this.app.metadata.cache[relativePath]))
  }

  private _rebuildTagStore() {
    const files: Record<string, string[]> = {}

    for (const [relativePath, entry] of Object.entries(this.app.metadata.cache)) {
      files[relativePath] = this._tagNames(entry)
    }

    this.store.setFiles(files)
  }
}
