import { Component } from "@typora-community-plugin/core"
import type TagPlugin from "src/main"


export class TagRenderer extends Component {

  constructor(private plugin: TagPlugin) {
    super()
  }

  onload() {

    this.plugin.registerMarkdownPreProcessor({
      when: 'preload',
      type: 'mdtext',
      process: md =>
        md.replace(/(^|\s)(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)/g, (_, $1, tag) => {
          this.plugin.store.add(tag)
          return `${$1}<i alt="tag">${tag}</i>`
        })
    })

    this.plugin.registerMarkdownPreProcessor({
      when: 'presave',
      type: 'mdtext',
      process: md =>
        md.replace(/<i alt="tag">(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)<\/i>/g, '$1')
    })
  }
}
