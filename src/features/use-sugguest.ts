import * as _ from "lodash"
import { type App, Component, EditorSuggest, Sidebar, WorkspaceRibbon, html } from "@typora-community-plugin/core"
import type TagPlugin from "../main"
import { TagPanel } from "./tag-panel"


export class UseSuggest extends Component {

  constructor(private app: App, private plugin: TagPlugin) {
    super()

    plugin.register(
      plugin.settings.onChange('useSuggest', (_, isEnabled) => {
        isEnabled
          ? this.load()
          : this.unload()
      }))
  }

  load() {
    if (!this.plugin.settings.get('useSuggest')) return
    super.load()
  }

  onload() {
    const { app, plugin } = this

    this.register(
      app.workspace.activeEditor.suggestion.register(
        new TagSuggest(plugin)))


    const sidebar = this.app.workspace.getViewByType(Sidebar)!

    this.register(
      this.app.workspace.getViewByType(WorkspaceRibbon)!.addButton({
        group: 'top',
        id: 'tag',
        title: plugin.i18n.t.ribbonTags,
        className: 'typ-tag-button',
        icon: html`<i class="fa fa-tags"></i>`,
        onclick: () => sidebar.switch(TagPanel),
      })
    )

    this.register(
      sidebar.addChild(new TagPanel(this.app, plugin)))
  }
}

class TagSuggest extends EditorSuggest<string> {

  triggerText = '#'

  suggestionKeys: string[] = []

  constructor(plugin: TagPlugin) {
    super()

    plugin.register(
      plugin.store.on('change', () =>
        this.suggestionKeys = plugin.store.toArray()))
  }

  findQuery(text: string) {
    const matched = text.match(/#([^#\s]*)$/) ?? []
    return {
      isMatched: !!matched[0],
      query: matched[1],
    }
  }

  getSuggestions(query: string) {
    if (!query) return this.suggestionKeys

    query = query.toLowerCase()
    const cache: Record<string, number> = {}
    return this.suggestionKeys
      .filter(n => {
        cache[n] = n.toLowerCase().indexOf(query)
        return cache[n] !== -1
      })
      .sort((a, b) => cache[a] - cache[b] || a.length - b.length)
      .slice(0, 50)
  }

  beforeApply(suggest: string) {
    return `<i alt="tag">${suggest}</i>`
  }
}

