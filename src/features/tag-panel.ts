import { type App, View, html } from '@typora-community-plugin/core'
import type TagPlugin from '../main'


export class TagPanel extends View {

  constructor(private app: App, private plugin: TagPlugin) {
    super()

    plugin.store.on('change', () => {
      this.renderTags()
    })
  }

  onload() {
    this.containerEl = $(`<div id="typ-tag-panel" style="display: none;"></div>`).get(0)!

    this.containerEl.onclick = event => {
      const el = event.target as HTMLElement
      if (!el.closest('i')) return
      const item = el.closest('.typ-tag-item') as HTMLElement
      this.plugin.store.delete(item.innerText)
    }
  }

  onunload() {
    this.containerEl.remove()
  }

  show() {
    this.renderTags()
    super.show()
  }

  private renderTags() {
    this.containerEl.innerHTML = ''
    this.containerEl.append(
      ...this.plugin.store.map(tag => html`<div class="typ-tag-item">${tag}<i class="fa fa-trash-o"></i></div>`)
    )
  }
}
