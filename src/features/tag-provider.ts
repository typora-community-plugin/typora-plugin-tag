import type { App } from "@typora-community-plugin/core"

type MetadataProvider = Parameters<App['metadata']['register']>[1]
type MetadataProviderContext = Parameters<MetadataProvider>[0]


const RE_INLINE_TAG = /(^|\s)(#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+)/g

const RE_HTML_COMMENT = /<!--[\s\S]*?-->/g
const RE_HTML_PAIR = /<([a-zA-Z][\w-]*)(?:\s[^>]*?)?>[\s\S]*?<\/\1\s*>/g
const RE_HTML_TAG = /<\/?[a-zA-Z][^>]*>/g

/** Remove inline HTML (paired elements, standalone tags and comments) so tags inside them are not parsed. */
function stripInlineHtml(line: string): string {
  return line
    .replace(RE_HTML_COMMENT, '')
    .replace(RE_HTML_PAIR, '')
    .replace(RE_HTML_TAG, '')
}

export async function tagProvider(ctx: MetadataProviderContext) {
  const tags: { name: string; lineText: string; lineNumber: number }[] = []
  let inFrontMatter = false
  let inFence = false
  let inHtmlBlock = false
  let inHtmlComment = false
  let htmlRawTag = ''
  const lines = (await ctx.text()).split(/\r\n|\r|\n/)
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const trimmed = line.trim()
    if (trimmed === '---' && (index === 0 || inFrontMatter)) {
      inFrontMatter = !inFrontMatter
      continue
    }
    if (inFrontMatter) continue
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (inHtmlBlock) {
      if (inHtmlComment) {
        if (line.includes('-->')) { inHtmlBlock = false; inHtmlComment = false }
      } else if (htmlRawTag) {
        if (new RegExp('</' + htmlRawTag + '\\s*>', 'i').test(line)) {
          inHtmlBlock = false; htmlRawTag = ''
        }
      } else if (trimmed === '') {
        inHtmlBlock = false
      }
      continue
    }
    if (trimmed.startsWith('<!--')) {
      inHtmlBlock = true
      inHtmlComment = !trimmed.includes('-->')
      continue
    }
    const raw = /^<(script|pre|style|textarea)(\s|\/?>|$)/i.exec(trimmed)
    if (raw) {
      if (!new RegExp('</' + raw[1] + '\\s*>', 'i').test(line)) {
        inHtmlBlock = true
        htmlRawTag = raw[1]
      }
      continue
    }
    if (/^<\/?[a-z][\w-]*(\s|\/?>|$)/i.test(trimmed)) {
      inHtmlBlock = true
      continue
    }
    for (const match of stripInlineHtml(line).match(RE_INLINE_TAG) ?? []) {
      tags.push({
        name: match.trim().slice(1),
        lineText: trimmed,
        lineNumber: index + 1,
      })
    }
  }
  return { metadata: { tags } }
}
