import * as _ from "lodash"
import { type App, Component, TextSuggest, Sidebar, WorkspaceRibbon, html } from "@typora-community-plugin/core"
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

    const suggest = new TagSuggest(plugin)

    this.register(
      app.workspace.activeEditor.suggestion.register(suggest))

    this.register(
      plugin.store.on('change', () => suggest.loadSuggestions()))


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

class TagSuggest extends TextSuggest {

  triggerText = '#'

  suggestions: string[] = []

  constructor(private plugin: TagPlugin) {
    super()

    this.loadSuggestions()
  }

  loadSuggestions = _.debounce(this._loadSuggestions, 1e3)

  private _loadSuggestions() {
    this.suggestions = this.plugin.store.toArray()
  }

  findQuery(text: string) {
    const matched = text.match(/#([^#\s]*)$/) ?? []
    return {
      isMatched: !!matched[0],
      query: matched[1],
    }
  }

  getSuggestions(query: string) {
    return super.getSuggestions(query).slice(0, 50)
  }

  beforeApply(suggest: string) {
    return `<i alt="tag">${suggest}</i>`
  }
}

