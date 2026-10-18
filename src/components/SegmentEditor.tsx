import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import type { LibraryItem, Segment } from "@/lib/model";
import { LibrarySearch } from "@/components/LibrarySearch";

interface SegmentEditorProps {
  value: Segment[];
  onChange: (segments: Segment[]) => void;
  library: LibraryItem[];
  placeholder?: string;
  minHeight?: string;
}

type CaretPosition =
  | {
      type: "text";
      segmentIndex: number;
      offset: number;
    }
  | {
      type: "boundary";
      segmentIndex: number;
    };

function isLibraryElement(element: Element) {
  return (
    element instanceof HTMLElement &&
    element.dataset.libraryId !== undefined
  );
}

function segmentsFromEditor(editor: HTMLElement): Segment[] {
  const segments: Segment[] = [];

  const appendText = (text: string) => {
    if (!text) return;

    const previous = segments[segments.length - 1];

    if (previous?.type === "text") {
      previous.content += text;
    } else {
      segments.push({
        type: "text",
        content: text,
      });
    }
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent ?? "");
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (isLibraryElement(node)) {
      segments.push({
        type: "libraryItem",
        libraryItemId: node.dataset.libraryId!,
      });
      return;
    }

    node.childNodes.forEach(walk);
  };

  editor.childNodes.forEach(walk);

  return segments;
}

function renderSegments(
  editor: HTMLElement,
  segments: Segment[],
  library: LibraryItem[],
) {
  editor.innerHTML = "";

  segments.forEach((segment) => {
    if (segment.type === "text") {
      if (segment.content) {
        editor.appendChild(document.createTextNode(segment.content));
      }
      return;
    }

    const item = library.find((i) => i.id === segment.libraryItemId);

    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.libraryId = segment.libraryItemId;
    chip.className =
      "mx-0.5 inline-flex items-center rounded-md bg-accent px-1.5 py-0.5 text-sm text-accent-foreground align-baseline";
    chip.textContent = item?.name ?? "Elemento removido";

    editor.appendChild(chip);
  });
}

/**
 * Descobre a posição lógica do cursor dentro dos Segment[].
 *
 * Quando o cursor está dentro de texto:
 *   { type: "text", segmentIndex, offset }
 *
 * Quando está entre dois segmentos:
 *   { type: "boundary", segmentIndex }
 */
function getCaretPosition(
  editor: HTMLElement,
  segments: Segment[],
): CaretPosition | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null;
  }

  const node = selection.anchorNode;
  const offset = selection.anchorOffset;

  if (!node || !editor.contains(node)) return null;

  // Cursor diretamente no elemento editor:
  // o offset indica entre que filhos estamos.
  if (node === editor) {
    return {
      type: "boundary",
      segmentIndex: offset,
    };
  }

  const child = node.parentNode;

  if (!child) return null;

  const directChild = node.nodeType === Node.TEXT_NODE
    ? node.parentNode
    : node;

  if (!directChild || directChild.parentNode !== editor) {
    return null;
  }

  const childIndex = Array.prototype.indexOf.call(
    editor.childNodes,
    directChild,
  );

  if (childIndex < 0) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    return {
      type: "text",
      segmentIndex: childIndex,
      offset,
    };
  }

  return {
    type: "boundary",
    segmentIndex: childIndex,
  };
}

/**
 * Encontra o nó DOM correspondente a um determinado segmento.
 */
function getRenderedChildIndex(
  segments: Segment[],
  segmentIndex: number,
): number {
  let renderedIndex = 0;

  for (let i = 0; i < segmentIndex; i += 1) {
    const segment = segments[i];

    if (segment.type === "text" && !segment.content) continue;

    renderedIndex += 1;
  }

  return renderedIndex;
}

function restoreCaret(
  editor: HTMLElement,
  segments: Segment[],
  position: CaretPosition,
) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();

  if (position.type === "text") {
    const childIndex = getRenderedChildIndex(
      segments,
      position.segmentIndex,
    );

    const node = editor.childNodes[childIndex];

    if (node?.nodeType === Node.TEXT_NODE) {
      const offset = Math.min(
        position.offset,
        node.textContent?.length ?? 0,
      );

      range.setStart(node, offset);
      range.collapse(true);
    } else {
      range.selectNodeContents(editor);
      range.collapse(false);
    }
  } else {
    const childIndex = getRenderedChildIndex(
      segments,
      position.segmentIndex,
    );

    range.setStart(
      editor,
      Math.min(childIndex, editor.childNodes.length),
    );
    range.collapse(true);
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

export function SegmentEditor({
  value,
  onChange,
  library,
  placeholder = "Escrever…",
  minHeight = "5rem",
}: SegmentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const caretPosition = useRef<CaretPosition | null>(null);

  const pendingCaret = useRef<CaretPosition | null>(null);

  const lastValueRef = useRef<Segment[] | null>(null);

  /**
   * Renderiza o conteúdo quando o valor externo muda.
   *
   * Depois de uma inserção da Biblioteca, restaura o cursor
   * para a posição lógica calculada anteriormente.
   */
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (lastValueRef.current === value) return;

    renderSegments(editor, value, library);
    lastValueRef.current = value;

    if (pendingCaret.current) {
      restoreCaret(editor, value, pendingCaret.current);
      caretPosition.current = pendingCaret.current;
      pendingCaret.current = null;
    }
  }, [value, library]);

  const saveCurrentSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const position = getCaretPosition(editor, value);

    if (position) {
      caretPosition.current = position;
    }
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const segments = segmentsFromEditor(editor);

    lastValueRef.current = segments;

    onChange(segments);

    saveCurrentSelection();
  };

  const insertLibraryItem = (item: LibraryItem) => {
    const position = caretPosition.current;

    let nextSegments: Segment[];
    let insertedLibraryIndex: number;

    if (!position) {
      nextSegments = [
        ...value,
        {
          type: "libraryItem",
          libraryItemId: item.id,
        },
        {
          type: "text",
          content: " ",
        },
      ];

      insertedLibraryIndex = value.length;
    } else if (position.type === "text") {
      const segment = value[position.segmentIndex];

      if (!segment || segment.type !== "text") {
        return;
      }

      const before = segment.content.slice(0, position.offset);
      const after = segment.content.slice(position.offset);

      const prefix = value.slice(0, position.segmentIndex);
      const suffix = value.slice(position.segmentIndex + 1);

      const middle: Segment[] = [];

      if (before) {
        middle.push({
          type: "text",
          content: before,
        });
      }

      insertedLibraryIndex = prefix.length + middle.length;

      middle.push({
        type: "libraryItem",
        libraryItemId: item.id,
      });

      middle.push({
        type: "text",
        content: " ",
      });

      if (after) {
        middle.push({
          type: "text",
          content: after,
        });
      }

      nextSegments = [...prefix, ...middle, ...suffix];
    } else {
      const prefix = value.slice(0, position.segmentIndex);
      const suffix = value.slice(position.segmentIndex);

      insertedLibraryIndex = prefix.length;

      nextSegments = [
        ...prefix,
        {
          type: "libraryItem",
          libraryItemId: item.id,
        },
        {
          type: "text",
          content: " ",
        },
        ...suffix,
      ];
    }

    const spaceIndex = insertedLibraryIndex + 1;

    pendingCaret.current = {
      type: "text",
      segmentIndex: spaceIndex,
      offset: 1,
    };

    // Força o próximo render a reconstruir o editor e restaurar
    // o cursor na nova posição.
    lastValueRef.current = null;

    onChange(nextSegments);
  };

  const removeLibraryItem = (libraryItemId: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const segments = value.filter(
      (segment) =>
        !(
          segment.type === "libraryItem" &&
          segment.libraryItemId === libraryItemId
        ),
    );

    lastValueRef.current = null;
    caretPosition.current = null;

    onChange(segments);
  };

  return (
    <div className="space-y-2">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="field-area min-h-20 whitespace-pre-wrap outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        style={{ minHeight }}
        onInput={handleInput}
        onFocus={saveCurrentSelection}
        onMouseUp={saveCurrentSelection}
        onKeyUp={saveCurrentSelection}
        onBlur={saveCurrentSelection}
      />

      {value.some((segment) => segment.type === "libraryItem") && (
        <div className="flex flex-wrap gap-1.5">
          {value
            .filter(
              (
                segment,
              ): segment is Extract<
                Segment,
                { type: "libraryItem" }
              > => segment.type === "libraryItem",
            )
            .map((segment, index) => {
              const item = library.find(
                (i) => i.id === segment.libraryItemId,
              );

              return (
                <span
                  key={`${segment.libraryItemId}-${index}`}
                  className="chip bg-accent text-accent-foreground"
                >
                  {item?.name ?? "Elemento removido"}

                  <button
                    type="button"
                    aria-label={`Remover ${item?.name ?? "elemento"}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      removeLibraryItem(segment.libraryItemId)
                    }
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
        </div>
      )}

      <div onMouseDownCapture={saveCurrentSelection}>
        <LibrarySearch
          placeholder="Adicionar elemento da biblioteca…"
          onSelect={insertLibraryItem}
        />
      </div>
    </div>
  );
}
