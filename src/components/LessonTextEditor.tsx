import { useRef } from "react";
import { X } from "lucide-react";
import type { LibraryItem } from "@/lib/model";
import { LibrarySearch } from "@/components/LibrarySearch";

interface LessonTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  library: LibraryItem[];
  selectedLibraryItemIds: string[];
  onLibraryItemsChange: (ids: string[]) => void;
  placeholder?: string;
  minHeight?: string;
}

export function LessonTextEditor({
  value,
  onChange,
  library,
  selectedLibraryItemIds,
  onLibraryItemsChange,
  placeholder = "Escrever…",
  minHeight = "5rem",
}: LessonTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosition = useRef(0);

  const saveCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    cursorPosition.current = textarea.selectionStart;
  };

  const insertLibraryItem = (item: LibraryItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const position = Math.min(cursorPosition.current, value.length);

    const before = value.slice(0, position);
    const after = value.slice(position);

    const separator =
      before.length > 0 && !before.endsWith(" ") ? " " : "";

    const insertedText = `${separator}${item.name}`;

    const newValue = before + insertedText + after;

    onChange(newValue);

    if (!selectedLibraryItemIds.includes(item.id)) {
      onLibraryItemsChange([
        ...selectedLibraryItemIds,
        item.id,
      ]);
    }

    const newCursorPosition =
      position + insertedText.length;

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        newCursorPosition,
        newCursorPosition,
      );
      cursorPosition.current = newCursorPosition;
    });
  };

  const removeLibraryItem = (libraryItemId: string) => {
    onLibraryItemsChange(
      selectedLibraryItemIds.filter(
        (id) => id !== libraryItemId,
      ),
    );
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        className="field-area"
        placeholder={placeholder}
        value={value}
        style={{ minHeight }}
        onChange={(e) => {
          onChange(e.target.value);
          cursorPosition.current = e.target.selectionStart;
        }}
        onClick={saveCursorPosition}
        onKeyUp={saveCursorPosition}
        onSelect={saveCursorPosition}
        onBlur={saveCursorPosition}
      />

      {selectedLibraryItemIds.length > 0 && (
        <div>
          <div className="eyebrow mb-1.5">
            Elementos selecionados
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedLibraryItemIds.map((id) => {
              const item = library.find(
                (libraryItem) => libraryItem.id === id,
              );

              if (!item) return null;

              return (
                <span
                  key={id}
                  className="chip bg-accent text-accent-foreground"
                >
                  {item.name}

                  <button
                    type="button"
                    aria-label={`Remover ${item.name}`}
                    onClick={() =>
                      removeLibraryItem(id)
                    }
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <LibrarySearch
        placeholder="Adicionar elemento da biblioteca…"
        onSelect={insertLibraryItem}
      />
    </div>
  );
}