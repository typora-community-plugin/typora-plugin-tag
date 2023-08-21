import * as _ from "lodash"
import { Events } from "@typora-community-plugin/core"


type TagEvents = {
  'change'(): void
}

export class TagStore extends Events<TagEvents> {

  private _store: Record<string, boolean> = {}

  has(value: string) {
    return this._store[value]
  }

  add(value: string): this {
    this._store[value] = true
    this.emit('change')
    return this
  }

  delete(value: string) {
    delete this._store[value]
    this.emit('change')
  }

  toArray() {
    return Object.keys(this._store)
  }

  map(iteratee: (value: string) => any) {
    return this.toArray().map(iteratee)
  }
}
