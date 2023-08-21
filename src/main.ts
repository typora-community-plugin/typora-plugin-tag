import { I18n, Plugin, Sidebar, WorkspaceRibbon, html } from '@typora-community-plugin/core'
import { TagStore } from './store'
import { TagRenderer } from './features/tag-renderer'
import { TagStyleToggler } from './features/style-toggler'
import { TagPanel } from './features/tag-panel'


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
    this.addChild(new TagStyleToggler(this))


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
}
