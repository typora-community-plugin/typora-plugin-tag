import { app, debounce, format, html, Notice, SidebarPanel } from '@typora-community-plugin/core'
import type TagPlugin from '../main'
import type { UseSuggest } from './use-sugguest'


const OVERSCAN = 8
const FALLBACK_ROW_HEIGHT = 28

export class TagPanel extends SidebarPanel {

  inputEl: HTMLInputElement
  resultEl: HTMLElement

  private listEl: HTMLElement
  private bodyEl: HTMLElement
  private noticeEl: HTMLElement
  private tags: string[] = []
  private rowHeight = 0
  private visibleStart = -1
  private visibleEnd = -1
  private scrollEl: HTMLElement | null = null
  private boundScrollEl: HTMLElement | null = null
  private scrolling = false
  private lastQuery: string | null = null

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

    useSuggest.register(
      app.settings.addChangeListener(
        ['internalPlugin.enabledPlugins', 'internal.metadata'],
        () => this.renderQueriedTags()))

    this.bodyEl = $('<div class="typ-tag-list-body"></div>').get(0) as HTMLElement
    this.listEl = $('<div class="typ-tag-list"></div>')
      .append(this.bodyEl)
      .get(0) as HTMLElement
    this.noticeEl = $('<div class="typ-tag-notice"></div>').get(0) as HTMLElement

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
          .append(this.noticeEl, this.listEl)
          .get(0)
      )
      .get(0)
  }

  onshow() {
    this._bindScroll()
    this.renderQueriedTags()
  }

  renderQueriedTags() {
    const enabled = this.plugin.metadataEnabled
    this.noticeEl.textContent = enabled
      ? ''
      : this.plugin.i18n.t.tagPanelMetadataRequired
    this.noticeEl.style.display = enabled ? 'none' : ''
    this.inputEl.disabled = !enabled

    const query = this.inputEl.value.trim()
    this.tags = enabled
      ? this.plugin.store
        .toArray()
        .filter(tag => tag.includes(query))
        .sort()
      : []

    this.visibleStart = this.visibleEnd = -1

    if (query !== this.lastQuery) {
      this.lastQuery = query
      const scrollEl = this._getScrollEl()
      if (scrollEl) scrollEl.scrollTop = 0
    }

    this._updateVisible(true)
  }

  debouncedRenderQueriedTags =
    debounce(() => this.renderQueriedTags(), 500)

  private _updateVisible(force = false) {
    const count = this.tags.length

    if (count === 0) {
      this.bodyEl.textContent = ''
      this.bodyEl.style.transform = ''
      this.listEl.style.height = '0px'
      this.visibleStart = this.visibleEnd = 0
      return
    }

    if (this.rowHeight === 0)
      this._measureRowHeight()

    const rowHeight = this.rowHeight || FALLBACK_ROW_HEIGHT
    const scrollEl = this._getScrollEl()
    const viewportHeight = scrollEl?.clientHeight || window.innerHeight
    const scrollTop = this._getScrollOffset()

    const start = Math.max(0, Math.min(
      count - 1,
      Math.floor(scrollTop / rowHeight) - OVERSCAN))
    const end = Math.min(
      count,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN)

    this.listEl.style.height = `${count * rowHeight}px`

    if (!force && start === this.visibleStart && end === this.visibleEnd)
      return

    this.visibleStart = start
    this.visibleEnd = end

    this.bodyEl.textContent = ''
    this.bodyEl.append(...this.tags.slice(start, end).map(tag => this._createTagItem(tag)))
    this.bodyEl.style.transform = `translateY(${start * rowHeight}px)`
  }

  private _measureRowHeight() {
    const probe = this._createTagItem(this.tags[0])
    this.bodyEl.append(probe)

    const height = probe.offsetHeight
    probe.remove()

    if (height > 0)
      this.rowHeight = height
  }

  private _getScrollEl(): HTMLElement | null {
    if (this.scrollEl?.isConnected)
      return this.scrollEl

    let el = this.resultEl?.parentElement ?? null
    while (el) {
      const overflowY = getComputedStyle(el).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll')
        break
      el = el.parentElement
    }

    this.scrollEl = el ?? document.documentElement
    return this.scrollEl
  }

  private _getScrollOffset() {
    const scrollEl = this._getScrollEl()
    if (!scrollEl) return 0

    const containerTop = scrollEl.getBoundingClientRect().top
    const listTop = this.listEl.getBoundingClientRect().top
    return Math.max(0, containerTop - listTop)
  }

  private _bindScroll() {
    const scrollEl = this._getScrollEl()
    if (!scrollEl || scrollEl === this.boundScrollEl) return

    this.boundScrollEl?.removeEventListener('scroll', this._onScroll)
    scrollEl.addEventListener('scroll', this._onScroll, { passive: true })
    this.boundScrollEl = scrollEl
  }

  private _onScroll = () => {
    if (this.scrolling) return

    this.scrolling = true
    requestAnimationFrame(() => {
      this.scrolling = false
      this._updateVisible()
    })
  }

  private _createTagItem(tag: string) {
    const { t } = this.plugin.i18n
    const count = this.plugin.store.count(tag)
    return html`<div class="typ-tag-item" data-tag="${tag}"><span class="typ-tag-name">${tag}</span><span class="typ-tag-count">${count}</span><i class="fa fa-search" data-action="search" title="${t.tagPanelSearchTag}" aria-label="${t.tagPanelSearchTag}"></i><i class="fa fa-trash-o" data-action="delete" title="${t.tagPanelDeleteTag}" aria-label="${t.tagPanelDeleteTag}"></i></div>`
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
