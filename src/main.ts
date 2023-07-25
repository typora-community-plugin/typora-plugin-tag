import { I18n, Plugin } from '@typora-community-plugin/core'
import { editor, isInputComponent } from 'typora'


export default class extends Plugin {

  i18n = new I18n({
    resources: {
      'en': { toggleTag: 'Toggle Focused/Selected Text Tag Style' },
      'zh-cn': { toggleTag: '切换标签样式' },
    }
  })

  onload() {

    this.registerMarkdownPreProcessor({
      when: 'preload',
      type: 'mdtext',
      process: md =>
        md.replace(/(^|\s)(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)/g, '$1<i alt="tag">$2</i>')
    })

    this.registerMarkdownPreProcessor({
      when: 'presave',
      type: 'mdtext',
      process: md =>
        md.replace(/<i alt="tag">(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)<\/i>/g, '$1')
    })

    this.registerCommand({
      id: 'toggle-style',
      title: this.i18n.t.toggleTag,
      scope: 'editor',
      hotkey: 'Alt+Ctrl+T',
      callback: toggleTagStyle,
    })
  }

  onunload() {
  }
}

function toggleTagStyle() {
  if (isInputComponent(document.activeElement)) return

  const selected = document.getSelection()?.anchorNode?.parentElement?.parentElement ?? null
  if (
    isTagEl(selected) ||
    isTagEl(selected!.children[1])
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
    editor.UserOp.pasteHandler(editor, html, true)
  }
}

function isTagEl(el: Element | null) {
  return el && el.tagName === 'I' && el.getAttribute('alt') === 'tag'
}
