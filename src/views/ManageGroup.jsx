import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { deleteGroup, getGroup, removeMember, scheduleChoices, updateGroup } from "../api/groups";
import Icon from "../components/Icon";
import { Avatar, BackButton, ToggleGroup } from "../components/ui";
import { BLOCKS, DAYS, MODALITIES } from "../data/mock";

// Administrar un grupo propio (B10): editar sus datos, cerrarlo o reabrirlo, expulsar
// integrantes y eliminarlo. Solo lo ve el creador.

const MAX_DESCRIPTION = 280;
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 10;

// Fecha local en formato YYYY-MM-DD, el que usa <input type="date">
const isoDate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

// Valores del formulario a partir del detalle del grupo
const formFrom = (group) => ({
  description: group.description ?? "",
  isOnline: group.isOnline,
  place: group.place ?? "",
  link: group.link ?? "",
  capacity: group.capacity,
  validUntil: group.validUntil,
  ...scheduleChoices(group.schedule),
});

function EditForm({ group, onSaved }) {
  const [form, setForm] = useState(() => formFrom(group));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [tomorrow] = useState(() => isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)));

  const set = (field) => (value) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  // El cupo no puede quedar bajo los integrantes actuales (el backend lo rechaza)
  const minCapacity = Math.max(MIN_CAPACITY, group.members);
  const meetingPoint = form.isOnline ? form.link.trim() : form.place.trim();
  const canSave =
    meetingPoint &&
    form.days.length > 0 &&
    form.blocks.length > 0 &&
    form.validUntil >= tomorrow &&
    !saving;

  const save = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setError("");
    setSaving(true);
    try {
      onSaved(await updateGroup(group.id, { ...form, isOpen: group.isOpen }));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form-card" onSubmit={save} aria-label="Editar grupo">
      <h2 className="section-title">Datos del grupo</h2>
      <label className="field">
        <span className="field-label">
          Descripción <span className="optional">(opcional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={MAX_DESCRIPTION}
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
        />
        <span className="field-hint">
          {form.description.length}/{MAX_DESCRIPTION}
        </span>
      </label>
      <div className="field">
        <span className="field-label">Modalidad</span>
        <div className="option-cards">
          {MODALITIES.map((m) => (
            <button
              key={String(m.id)}
              type="button"
              className={`option-card ${form.isOnline === m.id ? "option-card-active" : ""}`}
              aria-pressed={form.isOnline === m.id}
              onClick={() => set("isOnline")(m.id)}
            >
              <Icon name={m.id ? "monitor" : "mapPin"} size={22} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      {form.isOnline ? (
        <label className="field">
          <span className="field-label">Enlace de la reunión</span>
          <div className="input-wrap">
            <Icon name="monitor" size={18} />
            <input type="url" value={form.link} onChange={(e) => set("link")(e.target.value)} />
          </div>
        </label>
      ) : (
        <label className="field">
          <span className="field-label">Lugar</span>
          <div className="input-wrap">
            <Icon name="mapPin" size={18} />
            <input value={form.place} onChange={(e) => set("place")(e.target.value)} />
          </div>
        </label>
      )}
      <div className="field">
        <span className="field-label">Días</span>
        <ToggleGroup label="Días" options={DAYS} value={form.days} onChange={set("days")} multiple />
      </div>
      <div className="field">
        <span className="field-label">Bloques</span>
        <ToggleGroup
          label="Bloques"
          options={BLOCKS}
          value={form.blocks}
          onChange={set("blocks")}
          multiple
        />
      </div>
      <label className="field">
        <span className="field-label">Vigente hasta</span>
        <div className="input-wrap">
          <Icon name="calendar" size={18} />
          <input
            type="date"
            min={tomorrow}
            value={form.validUntil}
            onChange={(e) => set("validUntil")(e.target.value)}
          />
        </div>
      </label>
      <div className="field">
        <span className="field-label">Cupo</span>
        <div className="stepper">
          <button
            type="button"
            className="stepper-btn"
            aria-label="Disminuir cupo"
            disabled={form.capacity <= minCapacity}
            onClick={() => set("capacity")(form.capacity - 1)}
          >
            <Icon name="minus" size={18} />
          </button>
          <span className="stepper-value">
            <strong>{form.capacity}</strong> personas
          </span>
          <button
            type="button"
            className="stepper-btn"
            aria-label="Aumentar cupo"
            disabled={form.capacity >= MAX_CAPACITY}
            onClick={() => set("capacity")(form.capacity + 1)}
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
        <span className="field-hint">
          No puede ser menor que los {group.members} integrantes actuales. Si lo subes, las
          solicitudes en espera vuelven a quedar pendientes.
        </span>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="notice" role="status">
          <Icon name="check" size={16} /> Cambios guardados.
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

// onBack: vuelve a «mis grupos»; onDeleted: el grupo se eliminó
export default function ManageGroup({ group: summary, onBack, onDeleted }) {
  const [group, setGroup] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getGroup(summary.id)
      .then((detail) => active && setGroup(detail))
      .catch((err) => active && setLoadError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [summary.id]);

  // call: devuelve el detalle actualizado del grupo
  const act = async (call) => {
    setError("");
    setBusy(true);
    try {
      setGroup(await call());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleOpen = () =>
    act(() => updateGroup(group.id, { ...formFrom(group), isOpen: !group.isOpen }));

  const expel = (member) => {
    if (!window.confirm(`¿Expulsar a ${member.name} del grupo?`)) return;
    act(() => removeMember(group.id, member.id));
  };

  const remove = async () => {
    if (!window.confirm(`¿Eliminar el grupo de ${group.subject}? No se puede deshacer.`)) return;
    setError("");
    setBusy(true);
    try {
      await deleteGroup(group.id);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <BackButton onClick={onBack} />
      <div className="page-head">
        <div>
          <span className="eyebrow">Administrar grupo · {summary.code}</span>
          <h1>{summary.subject}</h1>
        </div>
      </div>

      {loadError ? (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      ) : !group ? (
        <p className="muted small" role="status">
          Cargando el grupo…
        </p>
      ) : (
        <div className="stack">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <section className="card">
            <div className="section-row">
              <h2 className="section-title">
                {group.isOpen ? "Recibe solicitudes" : "Grupo cerrado"}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={busy}
                onClick={toggleOpen}
              >
                {group.isOpen ? "Cerrar grupo" : "Reabrir grupo"}
              </button>
            </div>
            <p className="muted small">
              {group.isOpen
                ? "Cualquiera puede pedir unirse. Si el grupo está completo, las solicitudes quedan en espera hasta que se libere un cupo."
                : "Nadie puede pedir unirse. Las solicitudes que ya llegaron siguen esperando hasta que lo reabras."}
            </p>
          </section>

          <section className="card">
            <h2 className="section-title">
              Integrantes ({group.members}/{group.capacity})
            </h2>
            <ul className="member-list">
              {group.integrants.map((m) => (
                <li key={m.id} className="member">
                  <Avatar name={m.name} />
                  <div>
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.career}</span>
                  </div>
                  {m.isOwner ? (
                    <span className="badge badge-soft">Creador</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label={`Expulsar a ${m.name}`}
                      disabled={busy}
                      onClick={() => expel(m)}
                    >
                      Expulsar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <EditForm key={group.members} group={group} onSaved={setGroup} />

          <section className="card">
            <h2 className="section-title">Eliminar grupo</h2>
            <p className="muted small">
              Deja de aparecer en el buscador y para todos los integrantes.
            </p>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={remove}>
              <Icon name="trash" size={18} /> Eliminar grupo
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
