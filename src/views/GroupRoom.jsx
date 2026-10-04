import { useEffect, useRef, useState } from "react";
import { askAssistant } from "../api/assistant";
import Icon from "../components/Icon";
import { Avatar, BackButton, EmptyState } from "../components/ui";
import { blockLabel, dayLabel, modalityLabel } from "../data/mock";

// Espacio interno de un grupo: asistente de estudio (chatbot) a la izquierda y
// archivos compartidos a la derecha. El asistente responde usando esos archivos.
// Todo vive en estado local (maqueta): no se envía nada al backend.

const SUGGESTIONS = ["Resume los archivos", "Hazme preguntas de práctica", "Explícame un concepto"];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileExtension = (name) => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.at(-1).slice(0, 4).toUpperCase() : "ARCH";
};

const today = () => new Date().toLocaleDateString("es-CL", { day: "numeric", month: "short" });

const welcome = (subject) => ({
  id: 0,
  role: "bot",
  text: `¡Hola! Soy el asistente de estudio de ${subject}. Leo los archivos que suba el grupo y respondo tus dudas usando ese material. ¿Por dónde empezamos?`,
});

export default function GroupRoom({ group, user, initialFiles = [], onBack }) {
  const me = user.name.split(" ")[0];
  const [files, setFiles] = useState(initialFiles);
  const [messages, setMessages] = useState(() => [welcome(group.subject)]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const chatEnd = useRef(null);
  // Contador para ids locales; parte alto para no chocar con los ids de ejemplo.
  const nextId = useRef(10_000);

  useEffect(() => {
    chatEnd.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { id: nextId.current++, ...msg }]);

  const addFiles = (fileList) => {
    const added = [...fileList].map((file) => ({
      id: nextId.current++,
      name: file.name,
      size: file.size,
      uploadedBy: me,
      date: today(),
      // Enlace local para poder descargar el archivo recién subido.
      url: URL.createObjectURL?.(file),
    }));
    if (added.length === 0) return;
    setFiles((prev) => [...added, ...prev]);
    addMessage({
      role: "bot",
      text:
        added.length === 1
          ? `Listo, leí "${added[0].name}". Ya puedes preguntarme sobre su contenido.`
          : `Listo, leí ${added.length} archivos nuevos. Ya puedes preguntarme sobre ellos.`,
    });
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const ask = async (question) => {
    const text = question.trim();
    if (!text || thinking) return;
    addMessage({ role: "user", text });
    setDraft("");
    setThinking(true);
    try {
      const answer = await askAssistant({ question: text, files });
      addMessage({ role: "bot", text: answer.text, sources: answer.sources });
    } catch {
      addMessage({
        role: "bot",
        text: "No pude responder ahora. Intenta de nuevo en un momento.",
        error: true,
      });
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(draft);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const openPicker = () => fileInput.current?.click();

  return (
    <div className="page page-wide">
      <BackButton onClick={onBack} />

      <header className="card room-head">
        <div>
          <span className="eyebrow">Espacio del grupo</span>
          <h1>{group.subject}</h1>
          <div className="meta">
            <span className="meta-item">
              <Icon name={group.modality === "online" ? "monitor" : "mapPin"} size={16} />
              {modalityLabel(group.modality)} · {group.place}
            </span>
            <span className="meta-item">
              <Icon name="calendar" size={16} />
              {dayLabel(group.day)} · {blockLabel(group.block)}
            </span>
          </div>
        </div>
        <div className="avatar-stack" aria-label={`${group.integrants.length} integrantes`}>
          {group.integrants.slice(0, 4).map((m) => (
            <Avatar key={m.name} name={m.name} size="sm" />
          ))}
          {group.integrants.length > 4 && (
            <span className="avatar avatar-sm avatar-more">+{group.integrants.length - 4}</span>
          )}
        </div>
      </header>

      <div className="room-layout">
        {/* ---------- Asistente (chatbot) ---------- */}
        <section className="card chat" aria-label="Asistente de estudio">
          <div className="panel-head">
            <span className="bot-avatar bot-avatar-sm">
              <Icon name="sparkles" size={16} />
            </span>
            <h2>Asistente de estudio</h2>
            <span className="badge badge-soft">
              Usando {files.length} {files.length === 1 ? "archivo" : "archivos"}
            </span>
          </div>

          <ol className="chat-messages">
            {messages.map((msg) => {
              const mine = msg.role === "user";
              return (
                <li key={msg.id} className={`msg ${mine ? "msg-mine" : ""}`}>
                  {mine ? (
                    <Avatar name={user.name} size="sm" />
                  ) : (
                    <span className="bot-avatar">
                      <Icon name="sparkles" size={18} />
                    </span>
                  )}
                  <div className="msg-body">
                    <div className={`msg-bubble ${msg.error ? "msg-error" : ""}`}>
                      <p>{msg.text}</p>
                      {msg.sources?.length > 0 && (
                        <div className="msg-sources">
                          <span>Fuentes:</span>
                          {msg.sources.map((s) => (
                            <span key={s} className="msg-file">
                              <Icon name="file" size={14} />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {thinking && (
              <li className="msg">
                <span className="bot-avatar">
                  <Icon name="sparkles" size={18} />
                </span>
                <div className="msg-bubble typing" aria-label="El asistente está escribiendo">
                  <span />
                  <span />
                  <span />
                </div>
              </li>
            )}
            <li ref={chatEnd} aria-hidden="true" />
          </ol>

          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="pill pill-sm"
                disabled={thinking}
                onClick={() => ask(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <form className="chat-input" onSubmit={onSubmit}>
            <button
              type="button"
              className="input-action"
              aria-label="Adjuntar archivo"
              onClick={openPicker}
            >
              <Icon name="paperclip" size={20} />
            </button>
            <input
              placeholder="Pregúntale algo sobre los archivos…"
              aria-label="Pregunta al asistente"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm chat-send"
              aria-label="Enviar"
              disabled={!draft.trim() || thinking}
            >
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="chat-disclaimer">
            El asistente puede equivocarse. Contrasta sus respuestas con el material.
          </p>
        </section>

        {/* ---------- Archivos ---------- */}
        <aside className="card files" aria-label="Archivos del grupo">
          <div className="panel-head">
            <Icon name="file" size={18} />
            <h2>Archivos</h2>
            <span className="badge badge-soft">{files.length}</span>
          </div>

          <div
            className={`dropzone ${dragging ? "dropzone-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="dropzone-icon">
              <Icon name="upload" size={22} />
            </span>
            <strong>Arrastra tus archivos aquí</strong>
            <span className="muted small">PDF, Word, imágenes o apuntes</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={openPicker}>
              <Icon name="upload" size={16} /> Subir archivo
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              data-testid="file-input"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length === 0 ? (
            <EmptyState icon="file" title="Sin archivos">
              Sube apuntes o guías para que el asistente pueda usarlos.
            </EmptyState>
          ) : (
            <ul className="file-list">
              {files.map((f) => (
                <li key={f.id} className="file-item">
                  <span className="file-ext">{fileExtension(f.name)}</span>
                  <div className="file-info">
                    <strong title={f.name}>{f.name}</strong>
                    <span className="muted small">
                      {formatSize(f.size)} · {f.uploadedBy} · {f.date}
                    </span>
                  </div>
                  <div className="file-actions">
                    {f.url ? (
                      <a
                        className="input-action"
                        href={f.url}
                        download={f.name}
                        aria-label={`Descargar ${f.name}`}
                      >
                        <Icon name="download" size={18} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="input-action"
                        aria-label={`Descargar ${f.name}`}
                        disabled
                        title="Disponible cuando se conecte el backend"
                      >
                        <Icon name="download" size={18} />
                      </button>
                    )}
                    {f.uploadedBy === me && (
                      <button
                        type="button"
                        className="input-action input-action-danger"
                        aria-label={`Eliminar ${f.name}`}
                        onClick={() => removeFile(f.id)}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
