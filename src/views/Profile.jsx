import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { addMySubject, getSubjectCatalog, removeMySubject, updateProfile } from "../api/profile";
import GroupCard from "../components/GroupCard";
import Icon from "../components/Icon";
import { Avatar, EmptyState } from "../components/ui";
import { findSubject, normalizeCode, subjectLabel } from "../data/subjects";

// Mismo rango que el registro (Login.jsx) y que valida el backend
const CURRENT_YEAR = new Date().getFullYear();
const MIN_ENTRY_YEAR = 1990;

const byCode = (a, b) => a.code.localeCompare(b.code);

// Datos del perfil académico (nombre, carrera y año de ingreso). El correo y la universidad
// salen del correo institucional y no se editan.
function ProfileForm({ user, onSaved, onCancel }) {
  const [name, setName] = useState(user.name);
  const [career, setCareer] = useState(user.career ?? "");
  const [entryYear, setEntryYear] = useState(user.entryYear ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const validationError = () => {
    if (!name.trim() || !career.trim() || !entryYear) return "Completa todos los campos.";
    const year = Number(entryYear);
    if (year < MIN_ENTRY_YEAR || year > CURRENT_YEAR) {
      return `El año de ingreso debe estar entre ${MIN_ENTRY_YEAR} y ${CURRENT_YEAR}.`;
    }
    return "";
  };

  const save = async (e) => {
    e.preventDefault();
    const invalid = validationError();
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    try {
      onSaved(await updateProfile({ name, career, entryYear }));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="profile-info profile-form" onSubmit={save} noValidate>
      <label className="field">
        <span className="field-label">Nombre</span>
        <div className="input-wrap">
          <Icon name="user" size={18} />
          <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field-label">Carrera</span>
          <div className="input-wrap">
            <Icon name="book" size={18} />
            <input value={career} maxLength={120} onChange={(e) => setCareer(e.target.value)} />
          </div>
        </label>
        <label className="field">
          <span className="field-label">Año de ingreso</span>
          <div className="input-wrap">
            <Icon name="calendar" size={18} />
            <input
              type="number"
              inputMode="numeric"
              min={MIN_ENTRY_YEAR}
              max={CURRENT_YEAR}
              value={entryYear}
              onChange={(e) => setEntryYear(e.target.value)}
            />
          </div>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="profile-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default function Profile({
  user,
  groups,
  myGroups,
  onOpen,
  onCreate,
  onUpdateUser,
  onLogout,
}) {
  const [tab, setTab] = useState("created"); // "created" | "participating"
  const [editing, setEditing] = useState(false);
  // Asignaturas que ya existen en la universidad; crece cuando el usuario agrega una sigla nueva.
  const [catalog, setCatalog] = useState([]);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);
  // Estado de cada solicitud: undefined (pendiente) | "accepted" | "rejected"
  const [decisions, setDecisions] = useState({});

  useEffect(() => {
    getSubjectCatalog()
      .then(setCatalog)
      .catch(() => {
        // Sin catálogo igual se puede agregar: el backend pide el nombre si la sigla es nueva
      });
  }, []);

  const subjects = user.subjects;
  const findGroup = (id) => groups.find((g) => g.id === id);
  const pendingCount = myGroups.created
    .flatMap((c) => c.requests)
    .filter((r) => !decisions[r.id]).length;

  const match = newCode.trim() ? findSubject(catalog, newCode) : null;
  const needsName = Boolean(newCode.trim()) && !match;
  const canAdd = Boolean(newCode.trim()) && (match || newName.trim()) && !savingSubject;

  // "Buscar o crear": si la sigla no existe, el backend crea la asignatura con el nombre escrito.
  const addSubject = async (e) => {
    e.preventDefault();
    if (!canAdd) return;
    setSubjectError("");
    setSavingSubject(true);
    try {
      const subject = await addMySubject(normalizeCode(newCode), match ? "" : newName);
      if (!subjects.some((s) => s.id === subject.id)) {
        onUpdateUser({ subjects: [...subjects, subject].sort(byCode) });
      }
      if (!catalog.some((s) => s.id === subject.id)) setCatalog([...catalog, subject].sort(byCode));
      setNewCode("");
      setNewName("");
    } catch (err) {
      setSubjectError(errorMessage(err));
    } finally {
      setSavingSubject(false);
    }
  };

  const removeSubject = async (subject) => {
    setSubjectError("");
    try {
      await removeMySubject(subject.id);
      onUpdateUser({ subjects: subjects.filter((s) => s.id !== subject.id) });
    } catch (err) {
      setSubjectError(errorMessage(err));
    }
  };

  const decide = (requestId, decision) =>
    setDecisions((prev) => ({ ...prev, [requestId]: decision }));

  return (
    <div className="page">
      <section className="card profile-card">
        <Avatar name={user.name} size="lg" />
        {editing ? (
          <ProfileForm
            user={user}
            onSaved={(updated) => {
              onUpdateUser(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="profile-info">
              <h1>{user.name}</h1>
              <p className="muted">
                {user.career} · Ingreso {user.entryYear} · {user.university}
              </p>
              <p className="muted small meta-item">
                <Icon name="mail" size={16} /> {user.email}
              </p>
            </div>
            <div className="profile-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
                Editar perfil
              </button>
              <button type="button" className="btn btn-ghost" onClick={onLogout}>
                <Icon name="logout" size={18} /> Cerrar sesión
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Asignaturas del semestre</h2>
        <p className="muted small">Las usamos para sugerirte grupos.</p>
        <div className="chip-row">
          {subjects.map((subject) => (
            <span key={subject.id} className="chip chip-removable">
              {subjectLabel(subject)}
              <button
                type="button"
                aria-label={`Quitar ${subject.code}`}
                onClick={() => removeSubject(subject)}
              >
                <Icon name="x" size={14} strokeWidth={2.2} />
              </button>
            </span>
          ))}
          <form className="chip-add" onSubmit={addSubject}>
            <input
              list="profile-subject-codes"
              placeholder="Agregar sigla"
              autoCapitalize="characters"
              maxLength={20}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              aria-label="Sigla de la asignatura"
            />
            <datalist id="profile-subject-codes">
              {catalog.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </datalist>
            {needsName && (
              <input
                className="chip-add-name"
                placeholder="Nombre del ramo"
                maxLength={200}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                aria-label="Nombre del ramo"
              />
            )}
            <button type="submit" aria-label="Agregar" disabled={!canAdd}>
              <Icon name="plus" size={16} strokeWidth={2.2} />
            </button>
          </form>
        </div>
        {subjectError && (
          <p className="form-error" role="alert">
            {subjectError}
          </p>
        )}
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title section-title-lg">Mis grupos</h2>
        </div>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "created"}
            className={`tab ${tab === "created" ? "tab-active" : ""}`}
            onClick={() => setTab("created")}
          >
            Creados por mí
            {pendingCount > 0 && <span className="tab-count">{pendingCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "participating"}
            className={`tab ${tab === "participating" ? "tab-active" : ""}`}
            onClick={() => setTab("participating")}
          >
            Participo
          </button>
        </div>

        {tab === "created" && (
          <div className="stack">
            {myGroups.created.map(({ groupId, requests }) => {
              const group = findGroup(groupId);
              const pending = requests.filter((r) => !decisions[r.id]);
              return (
                <GroupCard
                  key={groupId}
                  group={group}
                  onOpen={onOpen}
                  ctaLabel="Abrir grupo"
                  footer={
                    <div className="requests">
                      <div className="requests-head">
                        <Icon name="bell" size={18} />
                        {pending.length > 0
                          ? `${pending.length} ${pending.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}`
                          : "Sin solicitudes pendientes"}
                      </div>
                      <ul>
                        {requests.map((r) => (
                          <li key={r.id} className="request">
                            <Avatar name={r.name} size="sm" />
                            <div className="request-who">
                              <strong>{r.name}</strong>
                              <span className="muted small">{r.career}</span>
                            </div>
                            {decisions[r.id] ? (
                              <span
                                className={`badge ${decisions[r.id] === "accepted" ? "badge-open" : "badge-closed"}`}
                              >
                                {decisions[r.id] === "accepted" ? "Aceptado" : "Rechazado"}
                              </span>
                            ) : (
                              <div className="request-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => decide(r.id, "rejected")}
                                >
                                  Rechazar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => decide(r.id, "accepted")}
                                >
                                  Aceptar
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                />
              );
            })}
            <button type="button" className="add-tile" onClick={onCreate}>
              <Icon name="plus" size={20} /> Crear otro grupo
            </button>
          </div>
        )}

        {tab === "participating" &&
          (myGroups.participating.length > 0 ? (
            <div className="group-grid">
              {myGroups.participating.map((id) => (
                <GroupCard key={id} group={findGroup(id)} onOpen={onOpen} ctaLabel="Abrir grupo" />
              ))}
            </div>
          ) : (
            <EmptyState icon="users" title="Aún no participas en grupos">
              Busca un grupo de tus ramos y solicita ingreso.
            </EmptyState>
          ))}
      </section>
    </div>
  );
}
