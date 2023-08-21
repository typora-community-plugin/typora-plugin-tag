import { SettingTab } from "@typora-community-plugin/core"
import type TagPlugin from "./main"


export class TagSettingTab extends SettingTab {

  get name() {
    return 'Tag'
  }

  constructor(private plugin: TagPlugin) {
    super()
  }

  show() {
    const { plugin } = this
    const { t } = this.plugin.i18n

    this.addSetting(setting => {
      setting.addName(t.useSuggest.name)
      setting.addDescription(t.useSuggest.desc)
      setting.addCheckbox(checkbox => {
        checkbox.checked = plugin.settings.get('useSuggest')
        checkbox.onclick = () => {
          plugin.settings.set('useSuggest', checkbox.checked)
        }
      })
    })

    super.show()
  }

  hide() {
    this.containerEl.innerHTML = ''
    super.hide()
  }

}
