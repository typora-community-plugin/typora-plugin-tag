import { debounce, SidebarPanel, html, app } from '@typora-community-plugin/core'
import type TagPlugin from '../main'
import type { UseSuggest } from './use-sugguest'


export class TagPanel extends SidebarPanel {

  inputEl: HTMLInputElement
  resultEl: HTMLElement

  constructor(private plugin: TagPlugin, useSuggest: UseSuggest) {
    super()

    this.addRibbonButton({
      group: 'top',
      id: 'tag',
      title: plugin.i18n.t.ribbonTags,
      className: 'typ-tag-button',
      icon: html`<i class="fa fa-tags"></i>`,
    })

    useSuggest.register(
      plugin.store.on('tag:change', this.debouncedRenderQueriedTags))

    this.containerEl = $(`<div id="typ-tag-panel"></div>`)
      .append(

        $('<div class="ty-sidebar-search-panel"></div>')
          .append(this.inputEl =
            $('<input placeholder="Search">')
              .on('input', this.debouncedRenderQueriedTags)
              .get(0) as any
          ),

        this.resultEl =
        $('<div class="typ-tag-results">')
          .on('click', event => {
            const el = event.target as HTMLElement
            if (!el.closest('i')) return
            const item = el.closest('.typ-tag-item') as HTMLElement
            const tag = item.innerText
            // handle: search tag
            if (el.classList.contains('fa-search')) {
              app.features.globalSearch.openAdvancedSearch('tag:' + tag.slice(1))
            }
            // handle: delete tag
            else {
              this.plugin.store.delete(tag)
              this.debouncedRenderQueriedTags()
            }
          })
          .get(0)
      )
      .get(0)
  }

  onshow() {
    this.renderQueriedTags()
  }

  renderQueriedTags() {
    const query = this.inputEl.value.trim()
    if (query === '') {
      const all = this.plugin.store
        .toArray()
        .sort()
      this._renderTags(all)
    }
    else {
      const tags = this.plugin.store
        .toArray()
        .filter(t => t.includes(query))
        .sort()
      this._renderTags(tags)
    }
  }

  debouncedRenderQueriedTags =
    debounce(() => this.renderQueriedTags(), 500)

  private _renderTags(tags: string[]) {
    this.resultEl.innerHTML = ''
    this.resultEl.append(
      ...tags.map(tag => html`<div class="typ-tag-item">${tag}<i class="fa fa-search"></i><i class="fa fa-trash-o"></i></div>`)
    )
  }
}
