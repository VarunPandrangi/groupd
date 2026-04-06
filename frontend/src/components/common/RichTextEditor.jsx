import { useEffect, useRef } from 'react';
import { TextB, TextItalic, TextUnderline } from '@phosphor-icons/react';
import { normalizeRichTextHtml, sanitizedRichTextHtml } from '../../utils/richText';

const TOOLBAR_ACTIONS = [
  { command: 'bold', label: 'Bold', icon: TextB },
  { command: 'italic', label: 'Italic', icon: TextItalic },
  { command: 'underline', label: 'Underline', icon: TextUnderline },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  ariaLabel = 'Rich text editor',
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedHtml = normalizeRichTextHtml(value);

    if (editor.innerHTML !== normalizedHtml) {
      editor.innerHTML = normalizedHtml;
    }
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedHtml = sanitizedRichTextHtml(editor.innerHTML);
    editor.innerHTML = normalizedHtml;
    onChange(normalizedHtml);
  };

  const handleToolbarAction = (command) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(command, false);
    syncValue();
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar" aria-label="Text formatting">
        {TOOLBAR_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.command}
              type="button"
              className="rich-text-editor__button"
              title={action.label}
              aria-label={action.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleToolbarAction(action.command)}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        className="rich-text-editor__surface"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        role="textbox"
        aria-label={ariaLabel}
        onInput={syncValue}
        onBlur={syncValue}
      />
    </div>
  );
}
