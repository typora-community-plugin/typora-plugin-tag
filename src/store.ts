import * as _ from "lodash"


export class TagStore extends Set<string> {

  private changeListeners: Function[] = []

  constructor() {
    super()
  }

  add(value: string): this {
    super.add(value)
    this.changeListeners.forEach(fn => fn())
    return this
  }

  delete(value: string): boolean {
    const res = super.delete(value)
    this.changeListeners.forEach(fn => fn())
    return res
  }

  toArray() {
    return [...this]
  }

  map(iteratee: (value: string) => any) {
    return this.toArray().map(iteratee)
  }

  onChange(listener: Function) {
    this.changeListeners.push(listener)
  }
}
