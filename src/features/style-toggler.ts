import { Component } from "@typora-community-plugin/core"
import { editor, isInputComponent } from "typora"
import type TagPlugin from "src/main"


export class TagStyleToggler extends Component {

  constructor(private plugin: TagPlugin) {
    super()
  }

  onload() {

    this.plugin.registerCommand({
      id: 'toggle-style',
      title: this.plugin.i18n.t.toggleTag,
      scope: 'editor',
      hotkey: 'Alt+Ctrl+T',
      callback: () => this.toggleTagStyle(),
    })
  }

  private toggleTagStyle() {
    if (isInputComponent(document.activeElement)) return

    const range = editor.selection.getRangy()
    if (range.collapsed) editor.selection.selectWord()
    this.includeLeadingHash()

    const selectedText = document.getSelection()?.toString() ?? ''
    if (this.isInTag() || selectedText.startsWith('#')) {
      editor.UserOp.pasteHandler(editor, selectedText.replace(/^#/, ''), false)
    }
    else {
      const tag = '#' + selectedText
      this.plugin.store.add(tag)
      editor.UserOp.pasteHandler(editor, tag, true)
    }
  }

  private includeLeadingHash() {
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const node = range.startContainer
    const text = node.nodeValue
    if (typeof text === 'string' && range.startOffset > 0 && text[range.startOffset - 1] === '#') {
      range.setStart(node, range.startOffset - 1)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  private isInTag() {
    let el: Node | null = document.getSelection()?.anchorNode ?? null
    while (el) {
      const classList = (el as Element).classList
      if (classList?.contains('typ-tag')) return true
      el = el.parentNode
    }
    return false
  }
}
