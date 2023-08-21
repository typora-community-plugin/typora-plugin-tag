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
      callback: this.toggleTagStyle,
    })
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
      this.plugin.store.add(tag)
      editor.UserOp.pasteHandler(editor, html, true)
    }
  }

  private isTagEl(el: Element | null) {
    return el && el.tagName === 'I' && el.getAttribute('alt') === 'tag'
  }
}
