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
        title: 'Tags',
        className: 'typ-tag-button',
        icon: html`<div class="typ-icon"><i class="fa fa-tags"></i></div>`,
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
    query = query.toLowerCase()
    return this.suggestionKeys
      .filter(n => n.toLowerCase().includes(query))
  }

  beforeApply(suggest: string) {
    return `<i alt="tag">${suggest}</i>`
  }
}

