import { useEffect, useRef, useState } from "react";
import { askAssistant } from "../api/assistant";
import { errorMessage } from "../api/client";
import { deleteFile, downloadFile, getFiles, uploadFile } from "../api/files";
import { getGroup } from "../api/groups";
import Icon from "../components/Icon";
import { Avatar, BackButton, EmptyState } from "../components/ui";
import { meetingPoint, modalityLabel, scheduleLabel } from "../data/mock";

// Espacio interno de un grupo: asistente de estudio (chatbot) a la izquierda y
// archivos compartidos a la derecha. El asistente responde usando esos archivos.
// Los archivos se guardan en el backend (B12); el asistente todavía es una simulación local (B13).

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

const welcome = (subject) => ({
  id: 0,
  role: "bot",
  text: `¡Hola! Soy el asistente de estudio de ${subject}. Leo los archivos que suba el grupo y respondo tus dudas usando ese material. ¿Por dónde empezamos?`,
});

export default function GroupRoom({ group, user, onBack }) {
  // null mientras cargan
  const [files, setFiles] = useState(null);
  const [filesError, setFilesError] = useState("");
  // Aviso cuando falla subir, descargar o eliminar un archivo
  const [fileNotice, setFileNotice] = useState("");
  const [uploading, setUploading] = useState(0);
  // Desde el detalle llegan los integrantes; desde "Mis grupos" no, y se piden al backend
  const [integrants, setIntegrants] = useState(group.integrants ?? null);
  const [messages, setMessages] = useState(() => [welcome(group.subject)]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const chatEnd = useRef(null);
  // Contador para los ids de los mensajes del chat
  const nextId = useRef(1);

  useEffect(() => {
    let active = true;
    getFiles(group.id)
      .then((list) => active && setFiles(list))
      .catch((err) => {
        if (!active) return;
        setFiles([]);
        setFilesError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [group.id]);

  useEffect(() => {
    if (group.integrants) return;
    let active = true;
    getGroup(group.id)
      .then((detail) => active && setIntegrants(detail.integrants))
      .catch(() => {
        // Sin integrantes el espacio igual funciona: solo no se muestran los avatares
      });
    return () => {
      active = false;
    };
  }, [group]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { id: nextId.current++, ...msg }]);

  // Se suben de a uno; si alguno falla, los demás siguen
  const addFiles = async (fileList) => {
    const pending = [...fileList];
    if (pending.length === 0) return;
    setFileNotice("");
    setUploading((n) => n + pending.length);
    const added = [];
    const problems = [];
    for (const file of pending) {
      try {
        const saved = await uploadFile(group.id, file);
        added.push(saved);
        setFiles((prev) => [saved, ...(prev ?? [])]);
      } catch (err) {
        problems.push(errorMessage(err));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (problems.length > 0) setFileNotice(problems.join(" "));
    if (added.length === 0) return;
    addMessage({
      role: "bot",
      text:
        added.length === 1
          ? `Listo, leí "${added[0].name}". Ya puedes preguntarme sobre su contenido.`
          : `Listo, leí ${added.length} archivos nuevos. Ya puedes preguntarme sobre ellos.`,
    });
  };

  const removeFile = async (file) => {
    setFileNotice("");
    try {
      await deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setFileNotice(errorMessage(err));
    }
  };

  const download = async (file) => {
    setFileNotice("");
    try {
      await downloadFile(file);
    } catch (err) {
      setFileNotice(errorMessage(err));
    }
  };

  const fileCount = files?.length ?? 0;

  const ask = async (question) => {
    const text = question.trim();
    if (!text || thinking) return;
    addMessage({ role: "user", text });
    setDraft("");
    setThinking(true);
    try {
      const answer = await askAssistant({ question: text, files: files ?? [] });
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
              <Icon name={group.isOnline ? "monitor" : "mapPin"} size={16} />
              {modalityLabel(group.isOnline)} · {meetingPoint(group)}
            </span>
            <span className="meta-item">
              <Icon name="calendar" size={16} />
              {scheduleLabel(group.schedule)}
            </span>
          </div>
        </div>
        {integrants && (
          <div className="avatar-stack" aria-label={`${integrants.length} integrantes`}>
            {integrants.slice(0, 4).map((m) => (
              <Avatar key={m.id ?? m.name} name={m.name} size="sm" />
            ))}
            {integrants.length > 4 && (
              <span className="avatar avatar-sm avatar-more">+{integrants.length - 4}</span>
            )}
          </div>
        )}
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
              Usando {fileCount} {fileCount === 1 ? "archivo" : "archivos"}
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
            <span className="badge badge-soft">{fileCount}</span>
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
            <span className="muted small">PDF, Word, imágenes o apuntes · hasta 10 MB</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={openPicker}
              disabled={uploading > 0}
            >
              <Icon name="upload" size={16} /> {uploading > 0 ? "Subiendo…" : "Subir archivo"}
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

          {fileNotice && (
            <p className="form-error" role="alert">
              {fileNotice}
            </p>
          )}

          {files === null ? (
            <p className="muted small">Cargando archivos…</p>
          ) : filesError ? (
            <p className="form-error" role="alert">
              {filesError}
            </p>
          ) : files.length === 0 ? (
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
                    <button
                      type="button"
                      className="input-action"
                      aria-label={`Descargar ${f.name}`}
                      onClick={() => download(f)}
                    >
                      <Icon name="download" size={18} />
                    </button>
                    {f.canDelete && (
                      <button
                        type="button"
                        className="input-action input-action-danger"
                        aria-label={`Eliminar ${f.name}`}
                        onClick={() => removeFile(f)}
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
