import { app, debounce, format, html, Notice, SidebarPanel } from '@typora-community-plugin/core'
import type TagPlugin from '../main'
import type { UseSuggest } from './use-sugguest'


export class TagPanel extends SidebarPanel {

  inputEl: HTMLInputElement
  resultEl: HTMLElement

  constructor(private plugin: TagPlugin, useSuggest: UseSuggest) {
    super()

    const { t } = plugin.i18n

    this.addRibbonButton({
      group: 'top',
      id: 'tag',
      title: t.ribbonTags,
      className: 'typ-tag-button',
      icon: html`<i class="fa fa-tags" aria-hidden="true"></i>`,
    })

    useSuggest.register(
      plugin.store.on('tag:change', this.debouncedRenderQueriedTags))

    this.containerEl = $(`<div id="typ-tag-panel"></div>`)
      .append(

        $('<div class="ty-sidebar-search-panel"></div>')
          .append(this.inputEl =
            $('<input>')
              .attr({ type: 'text', placeholder: t.tagPanelSearch })
              .on('input', this.debouncedRenderQueriedTags)
              .get(0) as HTMLInputElement
          ),

        this.resultEl =
        $('<div class="typ-tag-results"></div>')
          .on('click', event => this._onResultClick(event))
          .get(0)
      )
      .get(0)
  }

  onshow() {
    this.renderQueriedTags()
  }

  renderQueriedTags() {
    const query = this.inputEl.value.trim()
    const tags = this.plugin.store
      .toArray()
      .filter(tag => tag.includes(query))
      .sort()

    this.resultEl.innerHTML = ''
    this.resultEl.append(...tags.map(tag => this._createTagItem(tag)))
  }

  debouncedRenderQueriedTags =
    debounce(() => this.renderQueriedTags(), 500)

  private _createTagItem(tag: string) {
    const { t } = this.plugin.i18n
    return html`<div class="typ-tag-item" data-tag="${tag}">${tag}<i class="fa fa-search" data-action="search" title="${t.tagPanelSearchTag}" aria-label="${t.tagPanelSearchTag}"></i><i class="fa fa-trash-o" data-action="delete" title="${t.tagPanelDeleteTag}" aria-label="${t.tagPanelDeleteTag}"></i></div>`
  }

  private _onResultClick(event: JQuery.Event<HTMLElement>) {
    const target = event.target as HTMLElement
    const actionEl = target.closest<HTMLElement>('[data-action]')
    if (!actionEl) return

    const tag = actionEl.closest<HTMLElement>('.typ-tag-item')?.dataset.tag
    if (!tag) return

    switch (actionEl.dataset.action) {
      case 'search':
        app.features.globalSearch.openAdvancedSearch('tag:' + tag.slice(1))
        break
      case 'delete':
        this.plugin.store.delete(tag)
        Notice.success(format(this.plugin.i18n.t.tagPanelTagDeleted, { tag }))
        break
    }
  }
}
