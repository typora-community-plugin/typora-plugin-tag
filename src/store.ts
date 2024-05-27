import { Events } from "@typora-community-plugin/core"


type TagEvents = {
  'tag:change'(): void
}

export class TagStore extends Events<TagEvents> {

  private _store: Record<string, boolean> = {}

  has(value: string) {
    return this._store[value]
  }

  add(value: string): this {
    this._store[value] = true
    this.emit('tag:change')
    return this
  }

  bulkAdd(value: string[]) {
    value.forEach(tag => this._store[tag] = true)
    this.emit('tag:change')
    return this
  }

  delete(value: string) {
    delete this._store[value]
    this.emit('tag:change')
    return this
  }

  toArray() {
    return Object.keys(this._store)
  }
}
