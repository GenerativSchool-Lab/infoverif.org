import katex from 'katex'

export default function Equation({ expr, block = false, className = '' }) {
  const html = katex.renderToString(expr, {
    throwOnError: false,
    displayMode: block,
  })

  const Element = block ? 'div' : 'span'
  return <Element className={className} dangerouslySetInnerHTML={{ __html: html }} />
}




