import { Events } from "@typora-community-plugin/core"


type TagEvents = {
  'tag:change'(): void
}

export class TagStore extends Events<TagEvents> {

  private _store: Record<string, boolean> = {}
  private _counts: Record<string, number> = {}

  constructor() {
    super('TagStore')
  }

  has(value: string) {
    return this._store[value]
  }

  count(value: string) {
    return this._counts[value] ?? 0
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
    delete this._counts[value]
    this.emit('tag:change')
    return this
  }

  setCounts(counts: Record<string, number>) {
    this._counts = { ...counts }
    this._store = {}
    Object.keys(counts).forEach(tag => this._store[tag] = true)
    this.emit('tag:change')
    return this
  }

  toArray() {
    return Object.keys(this._store)
  }
}
