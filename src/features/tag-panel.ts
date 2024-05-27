import { debounce, View, html } from '@typora-community-plugin/core'
import type TagPlugin from '../main'
import type { UseSuggest } from './use-sugguest'


export class TagPanel extends View {

  inputEl: HTMLInputElement
  resultEl: HTMLElement

  constructor(private plugin: TagPlugin, useSuggest: UseSuggest) {
    super()

    useSuggest.register(
      plugin.store.on('change', this.debouncedRenderQueriedTags))
  }

  onload() {
    this.containerEl = $(`<div id="typ-tag-panel" style="display: none;"></div>`)
      .append(

        $('<div class="ty-sidebar-search-panel"></div>')
          .on('input', this.debouncedRenderQueriedTags)
          .append(this.inputEl =
            $('<input placeholder="Search">')
              .get(0) as any
          ),

        this.resultEl =
        $('<div class="typ-tag-results">')
          .on('click', event => {
            const el = event.target as HTMLElement
            if (!el.closest('i')) return
            const item = el.closest('.typ-tag-item') as HTMLElement
            this.plugin.store.delete(item.innerText)
          })
          .get(0)
      )
      .get(0)
  }

  onunload() {
    this.containerEl.remove()
  }

  show() {
    this.renderQueriedTags()
    super.show()
  }

  renderQueriedTags() {
    const query = this.inputEl.value.trim()
    if (query === '') {
      const all = this.plugin.store
        .toArray()
        .sort()
      this.renderTags(all)
    }
    else {
      const tags = this.plugin.store
        .toArray()
        .filter(t => t.includes(query))
        .sort()
      this.renderTags(tags)
    }
  }

  debouncedRenderQueriedTags =
    debounce(() => this.renderQueriedTags(), 500)

  private renderTags(tags: string[]) {
    this.resultEl.innerHTML = ''
    this.resultEl.append(
      ...tags.map(tag => html`<div class="typ-tag-item">${tag}<i class="fa fa-trash-o"></i></div>`)
    )
  }
}
