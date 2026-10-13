import { Events } from "@typora-community-plugin/core"


type TagEvents = {
  'tag:change'(): void
}

export class TagStore extends Events<TagEvents> {

  /** file -> tag names, one entry per occurrence (single source of truth). */
  private _fileTags = new Map<string, string[]>()
  /** tag -> total occurrence count (index derived from `_fileTags`). */
  private _counts = new Map<string, number>()

  constructor() {
    super('TagStore')
  }

  has(value: string) {
    return this._counts.has(value)
  }

  count(value: string) {
    return this._counts.get(value) ?? 0
  }

  add(value: string): this {
    if (!this._counts.has(value)) this._counts.set(value, 0)
    this.emit('tag:change')
    return this
  }

  delete(value: string): this {
    this._counts.delete(value)
    this.emit('tag:change')
    return this
  }

  /** Replace the tags of every file (full rebuild). */
  setFiles(files: Record<string, string[]>): this {
    this._fileTags = new Map()
    this._counts = new Map()

    for (const [filePath, tags] of Object.entries(files)) {
      if (tags.length === 0) continue
      this._fileTags.set(filePath, [...tags])
      for (const tag of tags) {
        this._counts.set(tag, (this._counts.get(tag) ?? 0) + 1)
      }
    }

    this.emit('tag:change')
    return this
  }

  /** Replace the tags of a single file, adjusting counts incrementally. */
  setFileTags(filePath: string, tags: string[]): this {
    this._applyFileTags(filePath, tags)
    this.emit('tag:change')
    return this
  }

  /** Remove a file, or a whole folder subtree, from the counts. */
  removeFiles(prefix: string): this {
    const affected = [...this._fileTags.keys()].filter(key =>
      key === prefix
      || key.startsWith(prefix + '/')
      || key.startsWith(prefix + '\\'))

    if (affected.length === 0) return this

    for (const key of affected) this._applyFileTags(key, [])
    this.emit('tag:change')
    return this
  }

  toArray() {
    return [...this._counts.keys()]
  }

  private _applyFileTags(filePath: string, tags: string[]) {
    const prev = this._fileTags.get(filePath) ?? []

    for (const tag of prev) {
      const count = (this._counts.get(tag) ?? 0) - 1
      if (count <= 0) this._counts.delete(tag)
      else this._counts.set(tag, count)
    }

    for (const tag of tags) {
      this._counts.set(tag, (this._counts.get(tag) ?? 0) + 1)
    }

    if (tags.length) this._fileTags.set(filePath, [...tags])
    else this._fileTags.delete(filePath)
  }
}
