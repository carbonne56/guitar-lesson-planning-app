import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { newId, type School } from "@/lib/model";
import { useStore } from "@/lib/store";

const SCHOOL_COLORS = [
  "#DCEAFE",
  "#DDF3E4",
  "#FBE5D6",
  "#E9DDF8",
  "#F8DDE5",
  "#D9F0F0",
  "#F5EDC8",
  "#E5E7EB",
];

export function SchoolManager() {
  const { state, update } = useStore();

  const [name, setName] = useState("");
  const [color, setColor] = useState(SCHOOL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(SCHOOL_COLORS[0]);
  const [message, setMessage] = useState("");

  const startEditing = (school: School) => {
    setEditingId(school.id);
    setEditName(school.name);
    setEditColor(school.color);
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditColor(SCHOOL_COLORS[0]);
  };

  const addSchool = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    const duplicate = state.schools.some(
      (school) =>
        school.name.trim().toLocaleLowerCase("pt") ===
        trimmedName.toLocaleLowerCase("pt"),
    );

    if (duplicate) {
      setMessage("Já existe um local com esse nome.");
      return;
    }

    const school: School = {
      id: newId("school"),
      name: trimmedName,
      color,
    };

    update((current) => ({
      ...current,
      schools: [...current.schools, school],
    }));

    setName("");
    setColor(SCHOOL_COLORS[0]);
    setMessage("");
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim()) return;

    const trimmedName = editName.trim();

    const duplicate = state.schools.some(
      (school) =>
        school.id !== editingId &&
        school.name.trim().toLocaleLowerCase("pt") ===
          trimmedName.toLocaleLowerCase("pt"),
    );

    if (duplicate) {
      setMessage("Já existe outro local com esse nome.");
      return;
    }

    update((current) => ({
      ...current,
      schools: current.schools.map((school) =>
        school.id === editingId
          ? { ...school, name: trimmedName, color: editColor }
          : school,
      ),
    }));

    cancelEditing();
    setMessage("");
  };

  const deleteSchool = (school: School) => {
    const confirmed = window.confirm(
      `Queres eliminar o local "${school.name}"?\n\nOs alunos associados ficarão sem local atribuído. As fichas dos alunos e os restantes dados serão preservados.`,
    );

    if (!confirmed) return;

    update((current) => ({
      ...current,
      schools: current.schools.filter((item) => item.id !== school.id),
      students: current.students.map((student) =>
        student.schoolId === school.id
          ? { ...student, schoolId: null }
          : student,
      ),
    }));

    if (editingId === school.id) cancelEditing();
    setMessage("");
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Locais de ensino
      </h2>

      <div className="surface divide-y">
        <div className="space-y-3 px-4 py-4">
          <h3 className="font-medium">Adicionar local</h3>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              addSchool();
            }}
          >
            <input
              className="field"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setMessage("");
              }}
              placeholder="Nome da escola ou local"
              aria-label="Nome do novo local de ensino"
              maxLength={100}
              required
            />

            <div>
              <p className="mb-2 text-sm font-medium">
                Cor de identificação
              </p>

              <div className="flex flex-wrap gap-2">
                {SCHOOL_COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={`Escolher cor ${option}`}
                    aria-pressed={color === option}
                    title={option}
                    onClick={() => setColor(option)}
                    className={`flex size-9 items-center justify-center rounded-md border-2 ${
                      color === option
                        ? "border-foreground"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: option }}
                  >
                    {color === option && (
                      <Check className="size-4 text-slate-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={!name.trim()}
            >
              <Plus className="size-4" />
              Adicionar local
            </button>
          </form>

          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
        </div>

        <div className="px-4 py-4">
          <h3 className="mb-3 font-medium">
            Locais existentes ({state.schools.length})
          </h3>

          {state.schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não existem locais de ensino. Adiciona o primeiro acima.
            </p>
          ) : (
            <ul className="divide-y">
              {state.schools.map((school) => (
                <li key={school.id} className="py-3 first:pt-0 last:pb-0">
                  {editingId === school.id ? (
                    <div className="space-y-3">
                      <input
                        className="field"
                        value={editName}
                        onChange={(event) => {
                          setEditName(event.target.value);
                          setMessage("");
                        }}
                        aria-label="Nome do local"
                        maxLength={100}
                        autoFocus
                      />

                      <div>
                        <p className="mb-2 text-sm font-medium">
                          Cor de identificação
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {SCHOOL_COLORS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              aria-label={`Escolher cor ${option}`}
                              aria-pressed={editColor === option}
                              title={option}
                              onClick={() => setEditColor(option)}
                              className={`flex size-9 items-center justify-center rounded-md border-2 ${
                                editColor === option
                                  ? "border-foreground"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: option }}
                            >
                              {editColor === option && (
                                <Check className="size-4 text-slate-700" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={cancelEditing}
                        >
                          <X className="size-4" />
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="btn-primary"
                          onClick={saveEditing}
                          disabled={!editName.trim()}
                        >
                          <Check className="size-4" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className="size-5 shrink-0 rounded-md border"
                        style={{ backgroundColor: school.color }}
                        aria-label={`Cor de ${school.name}`}
                      />

                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {school.name}
                      </span>

                      <button
                        type="button"
                        className="btn-ghost shrink-0"
                        title={`Editar ${school.name}`}
                        aria-label={`Editar ${school.name}`}
                        onClick={() => startEditing(school)}
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        className="btn-ghost shrink-0 text-destructive"
                        title={`Eliminar ${school.name}`}
                        aria-label={`Eliminar ${school.name}`}
                        onClick={() => deleteSchool(school)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
