import { normalizeRichTextHtml } from '../../utils/richText';

export default function FormattedText({
  text,
  fallback = '',
  as = 'div',
  className = '',
}) {
  const Component = as;
  const html = normalizeRichTextHtml(text);

  if (!html) {
    return (
      <Component className={`w-full text-sm leading-relaxed ${className}`.trim()}>
        {fallback}
      </Component>
    );
  }

  return (
    <Component
      className={`w-full text-sm leading-relaxed ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
