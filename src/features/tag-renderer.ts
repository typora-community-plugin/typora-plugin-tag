import { Component, DecoratedTextPostprocessor } from "@typora-community-plugin/core"
import type TagPlugin from "src/main"


export class TagRenderer extends Component {

  constructor(private plugin: TagPlugin) {
    super()
  }

  onload() {
    this.plugin.registerMarkdownPostProcessor(
      DecoratedTextPostprocessor.from({
        matches: [
          {
            regexp: /(^|\s)(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)/g,
            classname: 'typ-tag',
          },
        ],
      })
    )
  }
}
