import { normalizeRichTextHtml } from '../../utils/richText';

export default function FormattedText({
  text,
  fallback = '',
  as: Component = 'div',
  className = '',
}) {
  const html = normalizeRichTextHtml(text);

  if (!html) {
    return <Component className={className}>{fallback}</Component>;
  }

  return <Component className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
