import { useState } from "react";
import GroupCard from "../components/GroupCard";
import Icon from "../components/Icon";
import { Avatar, EmptyState } from "../components/ui";
import { subjects as allSubjects } from "../data/mock";
import { findSubject, normalizeCode, subjectLabel } from "../data/subjects";

export default function Profile({ user, groups, myGroups, onOpen, onCreate, onLogout }) {
  const [tab, setTab] = useState("created"); // "created" | "participating"
  // Asignaturas que existen en Coestudia; crece cuando alguien agrega una sigla nueva.
  const [catalog, setCatalog] = useState(allSubjects);
  const [subjects, setSubjects] = useState(user.subjects); // siglas
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  // Estado de cada solicitud: undefined (pendiente) | "accepted" | "rejected"
  const [decisions, setDecisions] = useState({});

  const findGroup = (id) => groups.find((g) => g.id === id);
  const pendingCount = myGroups.created
    .flatMap((c) => c.requests)
    .filter((r) => !decisions[r.id]).length;

  const match = newCode.trim() ? findSubject(catalog, newCode) : null;
  const needsName = Boolean(newCode.trim()) && !match;
  const canAdd = Boolean(newCode.trim()) && (match || newName.trim());

  // "Buscar o crear": si la sigla no existe, se crea la asignatura con el nombre escrito.
  const addSubject = (e) => {
    e.preventDefault();
    if (!canAdd) return;
    const subject = match ?? { code: normalizeCode(newCode), name: newName.trim() };
    if (!match) setCatalog([...catalog, subject]);
    if (!subjects.includes(subject.code)) setSubjects([...subjects, subject.code]);
    setNewCode("");
    setNewName("");
  };

  const decide = (requestId, decision) =>
    setDecisions((prev) => ({ ...prev, [requestId]: decision }));

  return (
    <div className="page">
      <section className="card profile-card">
        <Avatar name={user.name} size="lg" />
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p className="muted">
            {user.career} · Ingreso {user.entryYear} · {user.university}
          </p>
          <p className="muted small meta-item">
            <Icon name="mail" size={16} /> {user.email}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onLogout}>
          <Icon name="logout" size={18} /> Cerrar sesión
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">Asignaturas del semestre</h2>
        <p className="muted small">Las usamos para sugerirte grupos.</p>
        <div className="chip-row">
          {subjects.map((code) => (
            <span key={code} className="chip chip-removable">
              {subjectLabel(findSubject(catalog, code))}
              <button
                type="button"
                aria-label={`Quitar ${code}`}
                onClick={() => setSubjects(subjects.filter((x) => x !== code))}
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
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              aria-label="Sigla de la asignatura"
            />
            <datalist id="profile-subject-codes">
              {catalog.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </datalist>
            {needsName && (
              <input
                className="chip-add-name"
                placeholder="Nombre del ramo"
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
