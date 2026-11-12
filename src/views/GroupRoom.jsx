import { useEffect, useRef, useState } from "react";
import { MAX_QUESTION_LENGTH, askAssistant, clearConversation, getConversation } from "../api/assistant";
import { errorMessage } from "../api/client";
import { deleteFile, downloadFile, getFiles, uploadFile } from "../api/files";
import { getGroup, leaveGroup } from "../api/groups";
import GroupForum from "../components/GroupForum";
import Icon from "../components/Icon";
import { Avatar, BackButton, EmptyState } from "../components/ui";
import { meetingPoint, modalityLabel, scheduleLabel } from "../data/mock";

// Espacio interno de un grupo: a la izquierda, en pestañas, el foro del grupo (B16) y el
// asistente de estudio (chatbot); a la derecha, los archivos compartidos. El asistente responde
// solo con esos archivos (B13, Claude desde el backend). La conversación con el asistente es de todo
// el grupo: todos ven las preguntas de todos. Como el foro, se actualiza al abrir, después de cada
// respuesta y con «Actualizar», sin consultas periódicas.

const SUGGESTIONS = [
  "Resume los archivos",
  "Hazme preguntas de práctica",
  "Arma un control de 5 preguntas con pauta",
  "Explícame el concepto más importante",
];

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
  text: `¡Hola! Soy el asistente de estudio de ${subject}. Leo los archivos que suba el grupo (PDF, Word, PowerPoint o texto) y respondo solo con ese material: resúmenes, preguntas de práctica, cuestionarios o controles. ¿Por dónde empezamos?`,
});

// Mensajes del backend con ids propios, para no chocar con los avisos locales
const withWelcome = (subject, history) => [
  welcome(subject),
  ...history.map((m) => ({ ...m, id: `s${m.id}` })),
];

// onLeft: el usuario abandonó el grupo; onManage: el creador abre la administración
export default function GroupRoom({ group, user, onBack, onLeft, onManage }) {
  // null mientras cargan
  const [files, setFiles] = useState(null);
  const [filesError, setFilesError] = useState("");
  // Aviso cuando falla subir, descargar o eliminar un archivo
  const [fileNotice, setFileNotice] = useState("");
  const [uploading, setUploading] = useState(0);
  // Ids de los archivos que se están eliminando, para no mandar dos veces la misma petición
  const [deleting, setDeleting] = useState([]);
  // Desde el detalle llegan los integrantes; desde "Mis grupos" no, y se piden al backend
  const [integrants, setIntegrants] = useState(group.integrants ?? null);
  const [messages, setMessages] = useState(() => [welcome(group.subject)]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  // Pestaña del panel izquierdo: "forum" o "assistant"
  const [panel, setPanel] = useState("forum");
  const fileInput = useRef(null);
  const chatEnd = useRef(null);
  // Contador para los ids de los mensajes que no vienen del backend (avisos y errores)
  const nextId = useRef(1);

  useEffect(() => {
    let active = true;
    getFiles(group.id)
      .then((list) => {
        if (!active) return;
        // Si alguien subió un archivo antes de que llegara la lista, se conserva
        setFiles((prev) => [
          ...(prev ?? []).filter((f) => !list.some((loaded) => loaded.id === f.id)),
          ...list,
        ]);
      })
      .catch((err) => {
        if (!active) return;
        setFiles((prev) => prev ?? []);
        setFilesError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [group.id]);

  // Conversación del grupo con el asistente, después del saludo. Los avisos locales (archivo
  // subido, errores) se reemplazan por lo que hay en el backend. Devuelve false si falló.
  const loadConversation = async () => {
    try {
      setMessages(withWelcome(group.subject, await getConversation(group.id)));
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    getConversation(group.id)
      .then((history) => active && setMessages(withWelcome(group.subject, history)))
      .catch(() => {
        // El asistente igual funciona, pero se avisa que faltan los mensajes del grupo
        if (!active) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `l${nextId.current++}`,
            role: "bot",
            text: "No pudimos cargar la conversación del grupo. Prueba con «Actualizar».",
            error: true,
          },
        ]);
      });
    return () => {
      active = false;
    };
  }, [group.id, group.subject]);

  const refresh = async () => {
    setSyncing(true);
    if (!(await loadConversation())) {
      addMessage({ role: "bot", text: "No pudimos actualizar la conversación.", error: true });
    }
    setSyncing(false);
  };

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

  // Desde "Mis grupos" llega isOwner; desde el detalle, se deduce de los integrantes
  const isOwner = group.isOwner ?? integrants?.some((m) => m.isOwner && m.id === user.id) ?? false;

  const leave = async () => {
    if (!window.confirm(`¿Abandonar el grupo de ${group.subject}?`)) return;
    setLeaveError("");
    setLeaving(true);
    try {
      await leaveGroup(group.id);
      onLeft();
    } catch (err) {
      setLeaveError(errorMessage(err));
      setLeaving(false);
    }
  };

  useEffect(() => {
    chatEnd.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { ...msg, id: msg.id ?? `l${nextId.current++}` }]);

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
          ? `Listo, subiste "${added[0].name}". Ya puedes preguntarme sobre su contenido.`
          : `Listo, subiste ${added.length} archivos nuevos. Ya puedes preguntarme sobre ellos.`,
    });
  };

  const removeFile = async (file) => {
    if (deleting.includes(file.id)) return;
    setFileNotice("");
    setDeleting((prev) => [...prev, file.id]);
    try {
      await deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setFileNotice(errorMessage(err));
    } finally {
      setDeleting((prev) => prev.filter((id) => id !== file.id));
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
    const questionId = `l${nextId.current++}`;
    addMessage({ id: questionId, role: "user", text, isMine: true });
    setDraft("");
    setThinking(true);
    try {
      const answer = await askAssistant(group.id, text);
      // Se recarga la conversación para ver también lo que preguntaron los demás mientras tanto
      if (!(await loadConversation())) addMessage({ ...answer, id: `s${answer.id}` });
    } catch (err) {
      // Por ejemplo: límite diario de preguntas o asistente no disponible. El backend no guardó
      // la pregunta: se saca de la conversación y vuelve al cuadro de texto para reintentarla
      setMessages((prev) => prev.filter((m) => m.id !== questionId));
      setDraft((current) => current || text);
      addMessage({ role: "bot", text: errorMessage(err), error: true });
    } finally {
      setThinking(false);
    }
  };

  const clear = async () => {
    if (!window.confirm("¿Borrar la conversación del grupo con el asistente? La borras para todos."))
      return;
    setClearing(true);
    try {
      await clearConversation(group.id);
      setMessages([welcome(group.subject)]);
    } catch (err) {
      addMessage({ role: "bot", text: errorMessage(err), error: true });
    } finally {
      setClearing(false);
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
        <div className="room-head-side">
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
          {isOwner ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onManage(group)}>
              Administrar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={leaving}
              onClick={leave}
            >
              {leaving ? "Saliendo…" : "Abandonar grupo"}
            </button>
          )}
        </div>
      </header>
      {leaveError && (
        <p className="form-error" role="alert">
          {leaveError}
        </p>
      )}

      <div className="room-layout">
        <section className="card chat" aria-label="Foro y asistente">
          <div className="tabs room-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={panel === "forum"}
              className={`tab ${panel === "forum" ? "tab-active" : ""}`}
              onClick={() => setPanel("forum")}
            >
              <Icon name="chat" size={16} /> Foro
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panel === "assistant"}
              className={`tab ${panel === "assistant" ? "tab-active" : ""}`}
              onClick={() => setPanel("assistant")}
            >
              <Icon name="sparkles" size={16} /> Asistente
            </button>
          </div>

          {/* ---------- Foro del grupo ---------- */}
          {/* Los dos paneles quedan montados para no perder lo escrito al cambiar de pestaña */}
          <div className="chat-panel" role="tabpanel" aria-label="Foro del grupo" hidden={panel !== "forum"}>
            <GroupForum groupId={group.id} user={user} />
          </div>

          {/* ---------- Asistente (chatbot) ---------- */}
          <div
            className="chat-panel"
            role="tabpanel"
            aria-label="Asistente de estudio"
            hidden={panel !== "assistant"}
          >
            <div className="panel-head">
              <span className="bot-avatar bot-avatar-sm">
                <Icon name="sparkles" size={16} />
              </span>
              <h2>Asistente de estudio</h2>
              <span className="badge badge-soft">
                Usando {fileCount} {fileCount === 1 ? "archivo" : "archivos"}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={syncing || thinking}
                onClick={refresh}
              >
                {syncing ? "Actualizando…" : "Actualizar"}
              </button>
              {/* Solo el creador del grupo puede borrarla (también lo revisa el backend) */}
              {isOwner && messages.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={thinking || clearing}
                  onClick={clear}
                >
                  Borrar conversación
                </button>
              )}
            </div>

            <ol className="chat-messages">
              {messages.map((msg) => {
                const mine = msg.role === "user" && msg.isMine;
                // Pregunta de otro integrante: va a la izquierda, con su nombre
                const other = msg.role === "user" && !msg.isMine;
                return (
                  <li key={msg.id} className={`msg ${mine ? "msg-mine" : ""}`}>
                    {mine || other ? (
                      <Avatar name={mine ? user.name : msg.author} size="sm" />
                    ) : (
                      <span className="bot-avatar">
                        <Icon name="sparkles" size={18} />
                      </span>
                    )}
                    <div className="msg-body">
                      {other && <span className="msg-author">{msg.author}</span>}
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
                maxLength={MAX_QUESTION_LENGTH}
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
          </div>
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

          {/* Si falló la carga, la lista puede estar incompleta: se muestran igual los que se
              subieron después */}
          {filesError && (
            <p className="form-error" role="alert">
              {filesError}
            </p>
          )}

          {files === null ? (
            <p className="muted small">Cargando archivos…</p>
          ) : files.length === 0 ? (
            filesError ? null : (
            <EmptyState icon="file" title="Sin archivos">
              Sube apuntes o guías para que el asistente pueda usarlos.
            </EmptyState>
            )
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
                        disabled={deleting.includes(f.id)}
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
