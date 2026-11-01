import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { createGroup } from "../api/groups";
import { getSubjectCatalog } from "../api/profile";
import Icon from "../components/Icon";
import { CapacityBar, EmptyState, ToggleGroup } from "../components/ui";
import {
  BLOCKS,
  DAYS,
  MODALITIES,
  blockLabel,
  dayLabel,
  formatDate,
  modalityLabel,
} from "../data/mock";
import { findSubject, normalizeCode, subjectLabel } from "../data/subjects";

const MAX_DESCRIPTION = 280;
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 10;

// Fecha local en formato YYYY-MM-DD, el que usa <input type="date">
const isoDate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

// onOpen: abre el detalle del grupo recién publicado
export default function CreateGroup({ user, onOpen }) {
  // Asignaturas que ya existen en la universidad, para autocompletar la sigla
  const [subjects, setSubjects] = useState([]);
  const [code, setCode] = useState("");
  const [newName, setNewName] = useState("");
  const [description, setDescription] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");
  const [days, setDays] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [capacity, setCapacity] = useState(4);
  // GRUPO_ESTUDIO.vigente_hasta: después de esta fecha el grupo se elimina por vigencia
  const [validUntil, setValidUntil] = useState("");
  // Se calcula una vez al abrir el formulario: la vigencia mínima es mañana
  const [tomorrow] = useState(() => isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Grupo creado por el backend; mientras sea null se muestra el formulario
  const [published, setPublished] = useState(null);

  useEffect(() => {
    getSubjectCatalog()
      .then(setSubjects)
      .catch(() => {
        // Sin catálogo igual se puede publicar: se pide el nombre y el backend usa la sigla
        // existente si ya estaba
      });
  }, []);

  // "Buscar o crear": si la sigla ya existe se usa esa asignatura; si no, se pide su nombre
  // y el backend la crea al publicar el grupo.
  const existing = code.trim() ? findSubject(subjects, code) : null;
  const subjectName = existing ? existing.name : newName.trim();
  const meetingPoint = isOnline ? link.trim() : place.trim();
  const canPublish =
    code.trim() &&
    subjectName &&
    meetingPoint &&
    days.length > 0 &&
    blocks.length > 0 &&
    validUntil >= tomorrow &&
    !saving;
  // Los ramos del usuario aparecen primero en el autocompletado.
  const isMine = (subject) => user.subjects.some((s) => s.code === subject.code);
  const options = [...subjects].sort((a, b) => isMine(b) - isMine(a));

  const publish = async (e) => {
    e.preventDefault();
    if (!canPublish) return;
    setError("");
    setSaving(true);
    try {
      const group = await createGroup({
        code: normalizeCode(code),
        subjectName: existing ? "" : newName.trim(),
        description,
        isOnline,
        place,
        link,
        days,
        blocks,
        capacity,
        validUntil,
      });
      setPublished(group);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  if (published) {
    return (
      <div className="page page-narrow">
        <EmptyState
          icon="check"
          title="¡Grupo publicado!"
          action={
            <button type="button" className="btn btn-primary" onClick={() => onOpen(published)}>
              Ver mi grupo
            </button>
          }
        >
          Tu grupo de {published.subject} ya está visible. Te avisaremos cuando alguien quiera
          unirse.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Crear grupo</h1>
          <p className="muted">Completa los datos y publica. Puedes editarlo después.</p>
        </div>
      </div>

      <div className="create-layout">
        <form className="card form-card" onSubmit={publish}>
          <fieldset className="form-section">
            <legend>
              <span className="step">1</span> ¿Qué van a estudiar?
            </legend>
            <label className="field">
              <span className="field-label">Sigla de la asignatura</span>
              <div className="input-wrap">
                <Icon name="book" size={18} />
                <input
                  list="subject-codes"
                  placeholder="Ej: MAT1620"
                  autoCapitalize="characters"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <datalist id="subject-codes">
                  {options.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
              </div>
              {existing && (
                <span className="field-note">
                  <Icon name="check" size={14} strokeWidth={2.4} /> {existing.name}
                </span>
              )}
            </label>
            {code.trim() && !existing && (
              <label className="field">
                <span className="field-label">Nombre del ramo</span>
                <div className="input-wrap">
                  <Icon name="book" size={18} />
                  <input
                    placeholder="Ej: Cálculo II"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <span className="field-hint">
                  {normalizeCode(code)} aún no está en Coestudia: se agregará con este nombre.
                </span>
              </label>
            )}
            <label className="field">
              <span className="field-label">
                Descripción <span className="optional">(opcional)</span>
              </span>
              <textarea
                rows={3}
                maxLength={MAX_DESCRIPTION}
                placeholder="Cuéntales qué materia van a repasar, qué deben traer, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="field-hint">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend>
              <span className="step">2</span> ¿Cómo y cuándo?
            </legend>
            <div className="field">
              <span className="field-label">Modalidad</span>
              <div className="option-cards">
                {MODALITIES.map((m) => (
                  <button
                    key={String(m.id)}
                    type="button"
                    className={`option-card ${isOnline === m.id ? "option-card-active" : ""}`}
                    aria-pressed={isOnline === m.id}
                    onClick={() => setIsOnline(m.id)}
                  >
                    <Icon name={m.id ? "monitor" : "mapPin"} size={22} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {isOnline ? (
              <label className="field">
                <span className="field-label">Enlace de la reunión</span>
                <div className="input-wrap">
                  <Icon name="monitor" size={18} />
                  <input
                    type="url"
                    placeholder="Ej: https://meet.google.com/abc-defg-hij"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
                <span className="field-hint">Solo lo verán los integrantes aceptados.</span>
              </label>
            ) : (
              <label className="field">
                <span className="field-label">Lugar</span>
                <div className="input-wrap">
                  <Icon name="mapPin" size={18} />
                  <input
                    placeholder="Ej: Biblioteca central, sala 2"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                  />
                </div>
                <span className="field-hint">Solo lo verán los integrantes aceptados.</span>
              </label>
            )}
            <div className="field">
              <span className="field-label">Días</span>
              <ToggleGroup label="Días" options={DAYS} value={days} onChange={setDays} multiple />
            </div>
            <div className="field">
              <span className="field-label">Bloques</span>
              <ToggleGroup
                label="Bloques"
                options={BLOCKS}
                value={blocks}
                onChange={setBlocks}
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
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <span className="field-hint">
                Después de esta fecha el grupo se elimina solo (ej. el día del examen).
              </span>
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend>
              <span className="step">3</span> ¿Cuántos pueden sumarse?
            </legend>
            <div className="stepper">
              <button
                type="button"
                className="stepper-btn"
                aria-label="Disminuir cupo"
                disabled={capacity <= MIN_CAPACITY}
                onClick={() => setCapacity((c) => c - 1)}
              >
                <Icon name="minus" size={18} />
              </button>
              <span className="stepper-value">
                <strong>{capacity}</strong> personas
              </span>
              <button
                type="button"
                className="stepper-btn"
                aria-label="Aumentar cupo"
                disabled={capacity >= MAX_CAPACITY}
                onClick={() => setCapacity((c) => c + 1)}
              >
                <Icon name="plus" size={18} />
              </button>
            </div>
            <span className="field-hint">Te incluye a ti. Máximo {MAX_CAPACITY}.</span>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!canPublish}>
            {saving ? "Publicando…" : "Publicar grupo"}
          </button>
          {!canPublish && !saving && (
            <p className="field-hint center">
              Completa la asignatura, el {isOnline ? "enlace" : "lugar"}, al menos un día y un
              bloque, y hasta cuándo estará vigente.
            </p>
          )}
        </form>

        <aside className="preview">
          <span className="preview-label">Vista previa</span>
          <div className="group-card preview-card">
            <div className="group-card-main">
              <div className="group-card-head">
                <h3>
                  {subjectName
                    ? subjectLabel({ code: normalizeCode(code), name: subjectName })
                    : "Tu asignatura"}
                </h3>
                <span className="badge badge-open">Abierto</span>
              </div>
              <div className="meta">
                <span className="meta-item">
                  <Icon name={isOnline ? "monitor" : "mapPin"} size={16} />
                  {modalityLabel(isOnline)}
                </span>
                <span className="meta-item">
                  <Icon name="calendar" size={16} />
                  {days.length ? days.map(dayLabel).join(", ") : "Sin días"} ·{" "}
                  {blocks.length ? blocks.map(blockLabel).join(", ") : "Sin bloque"}
                </span>
                {validUntil && (
                  <span className="meta-item">
                    <Icon name="clock" size={16} />
                    Hasta el {formatDate(validUntil)}
                  </span>
                )}
              </div>
              {description && <p className="preview-desc">{description}</p>}
              <CapacityBar members={1} capacity={capacity} />
            </div>
          </div>
          <p className="muted small">Así verán tu grupo los demás estudiantes.</p>
        </aside>
      </div>
    </div>
  );
}
