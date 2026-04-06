import { useEffect, useRef, useState } from 'react';
import { TextB, TextItalic, TextUnderline } from '@phosphor-icons/react';
import { normalizeRichTextHtml, sanitizedRichTextHtml } from '../../utils/richText';

const TOOLBAR_ACTIONS = [
  { command: 'bold', label: 'Bold', icon: TextB },
  { command: 'italic', label: 'Italic', icon: TextItalic },
  { command: 'underline', label: 'Underline', icon: TextUnderline },
];

const EMPTY_FORMATTING_STATE = {
  bold: false,
  italic: false,
  underline: false,
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  ariaLabel = 'Rich text editor',
}) {
  const editorRef = useRef(null);
  const lastEmittedValueRef = useRef(normalizeRichTextHtml(value));
  const [activeFormats, setActiveFormats] = useState(EMPTY_FORMATTING_STATE);

  const updateToolbarState = () => {
    const editor = editorRef.current;

    if (!editor || typeof document === 'undefined') {
      setActiveFormats(EMPTY_FORMATTING_STATE);
      return;
    }

    const selection = document.getSelection();
    const hasSelectionInEditor =
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode) &&
      editor.contains(selection.focusNode);

    if (!hasSelectionInEditor && document.activeElement !== editor) {
      setActiveFormats(EMPTY_FORMATTING_STATE);
      return;
    }

    const nextFormats = TOOLBAR_ACTIONS.reduce((formats, action) => {
      let isActive = false;

      try {
        isActive = document.queryCommandState(action.command);
      } catch {
        isActive = false;
      }

      return {
        ...formats,
        [action.command]: isActive,
      };
    }, {});

    setActiveFormats((currentFormats) => {
      const hasChanged = TOOLBAR_ACTIONS.some(
        (action) => currentFormats[action.command] !== nextFormats[action.command]
      );

      return hasChanged ? nextFormats : currentFormats;
    });
  };

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedHtml = normalizeRichTextHtml(value);
    const isFocused = typeof document !== 'undefined' && document.activeElement === editor;
    const isLocalEcho = normalizedHtml === lastEmittedValueRef.current;

    if (editor.innerHTML !== normalizedHtml && !(isFocused && isLocalEcho)) {
      editor.innerHTML = normalizedHtml;
    }

    lastEmittedValueRef.current = normalizedHtml;
  }, [value]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleSelectionChange = () => {
      updateToolbarState();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const syncValue = ({ normalizeDom = false } = {}) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const normalizedHtml = sanitizedRichTextHtml(editor.innerHTML);

    if (normalizeDom && editor.innerHTML !== normalizedHtml) {
      editor.innerHTML = normalizedHtml;
    }

    lastEmittedValueRef.current = normalizedHtml;
    onChange(normalizedHtml);
    updateToolbarState();
  };

  const handleToolbarAction = (command) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(command, false);
    syncValue({ normalizeDom: true });
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
              className={`rich-text-editor__button ${
                activeFormats[action.command] ? 'rich-text-editor__button--active' : ''
              }`}
              title={action.label}
              aria-label={action.label}
              aria-pressed={activeFormats[action.command]}
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
        dir="ltr"
        role="textbox"
        aria-label={ariaLabel}
        onInput={() => syncValue()}
        onBlur={() => syncValue({ normalizeDom: true })}
        onFocus={updateToolbarState}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
      />
    </div>
  );
}
