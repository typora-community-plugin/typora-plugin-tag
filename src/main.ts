import { I18n, Plugin, Sidebar, WorkspaceRibbon, html } from '@typora-community-plugin/core'
import { editor, isInputComponent } from 'typora'
import { TagStore } from './store'
import { TagPanel } from './features/tag-panel'
import { TagRenderer } from './features/tag-renderer'


export default class TagPlugin extends Plugin {

  i18n = new I18n({
    resources: {
      'en': {
        toggleTag: 'Toggle Focused/Selected Text Tag Style',
      },
      'zh-cn': {
        toggleTag: '切换标签样式',
      },
    }
  })

  store = new TagStore()

  onload() {

    this.addChild(new TagRenderer(this))

    this.registerCommand({
      id: 'toggle-style',
      title: this.i18n.t.toggleTag,
      scope: 'editor',
      hotkey: 'Alt+Ctrl+T',
      callback: this.toggleTagStyle,
    })


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
      sidebar.addChild(new TagPanel(this.app, this)))
  }

  private toggleTagStyle() {
    if (isInputComponent(document.activeElement)) return

    const selected = document.getSelection()?.anchorNode?.parentElement?.parentElement ?? null
    if (
      this.isTagEl(selected) ||
      this.isTagEl(selected!.children[1])
    ) {
      editor.selection.selectPhrase()
      const selectedText = document.getSelection()?.toString() ?? ''
      const [, text] = selectedText.match(/<i alt="tag">#([^<]+)<\/i>/) ?? []
      editor.UserOp.pasteHandler(editor, text, false)
    }
    else {
      const range = editor.selection.getRangy()
      if (range.collapsed) editor.selection.selectWord()
      const selectedText = document.getSelection()?.toString() ?? ''
      const tag = (selectedText.startsWith('#') ? '' : '#') + selectedText
      const html = `<i alt="tag">${tag}</i>`
      this.store.add(tag)
      editor.UserOp.pasteHandler(editor, html, true)
    }
  }

  private isTagEl(el: Element | null) {
    return el && el.tagName === 'I' && el.getAttribute('alt') === 'tag'
  }
}
