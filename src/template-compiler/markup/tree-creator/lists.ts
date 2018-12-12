export class TagNamesLists {

  public explicitlyForbiddenTagNames = [
    'html',
    'head',
    'title',
    'base',
    'link',
    'meta',
    'style',
    'body',
    'script',
    'noscript',
    'template',
    'slot',
  ]

  public allowedTagNames = [
    'article',
    'section',
    'nav',
    'aside',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hgroup',
    'header',
    'footer',
    'address',
    // grouping content
    'p',
    'hr',
    'pre',
    'blockquote',
    'ol',
    'ul',
    'menu',
    'li',
    'dl',
    'dt',
    'dd',
    'figure',
    'figcaption',
    'main',
    'div',
    // text-level semantics
    'a',
    'em',
    'strong',
    'small',
    's',
    'cite',
    'q',
    'dfn',
    'abbr',
    'ruby',
    'rt',
    'rp',
    'data',
    'time',
    'code',
    'var',
    'samp',
    'kbd',
    'sub',
    'sup',
    'i',
    'b',
    'u',
    'mark',
    'bdi',
    'bdo',
    'span',
    'br',
    'wbr',
    // edits
    'ins',
    'del',
    // embedded
    'picture',
    'source',
    'img',
    'iframe', // uh
    'embed',
    'object',
    'param',
    'video',
    'audio',
    'track',
    'map',
    'area',
    // tabular data
    'table',
    'caption',
    'colgroup',
    'col',
    'tbody',
    'thead',
    'tfoot',
    'tr',
    'td',
    'th',
    // forms
    'form',
    'label',
    'input',
    'button',
    'select',
    'datalist',
    'optgroup',
    'option',
    'textarea',
    'output',
    'progress',
    'meter',
    'fieldset',
    'legend',
    // interactive
    // TODO: maybe somehow augment this to be wane-aware as well?
    'details',
    'summary',
    'dialog',
    // interactive
    'canvas',
  ]

  public elementsWithOnlyOpeningTag = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
    'template',
  ]

  public addElementWithOnlyOpeningTag (el: string): this {
    this.elementsWithOnlyOpeningTag.push(el)
    return this
  }

}