import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../api/client";
import {
  createTopic,
  getTopic,
  getTopics,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  replyTopic,
} from "../api/forum";
import Icon from "./Icon";
import { Avatar, EmptyState } from "./ui";

// Foro del grupo (B16): lista de temas (ej. «Guía 2 – Ejercicio 3»), cada uno con su pregunta y
// las respuestas debajo. Se carga al abrir y con «Actualizar»; no consulta solo cada pocos
// segundos, para no mantener despierta la base de datos del plan gratuito.

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function Post({ author, isMine, date, text, user }) {
  return (
    <article className="forum-post">
      <header className="forum-post-head">
        <Avatar name={isMine ? user.name : author} size="sm" />
        <strong>{isMine ? "Tú" : author}</strong>
        <span className="muted small">{date}</span>
      </header>
      <p>{text}</p>
    </article>
  );
}

export default function GroupForum({ groupId, user }) {
  // null mientras cargan
  const [topics, setTopics] = useState(null);
  // "list" | "new" | id del tema abierto
  const [view, setView] = useState("list");
  // Tema abierto con sus respuestas; null mientras carga
  const [topic, setTopic] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  // Vista actual, para descartar la respuesta de un tema que ya se cerró mientras cargaba
  const currentView = useRef(view);
  const goTo = (next) => {
    currentView.current = next;
    setView(next);
  };

  const loadTopics = async () => {
    setError("");
    setLoading(true);
    try {
      setTopics(await getTopics(groupId));
    } catch (err) {
      setTopics((prev) => prev ?? []);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTopic = async (id) => {
    setError("");
    setLoading(true);
    try {
      const loaded = await getTopic(id);
      if (currentView.current === id) setTopic(loaded);
    } catch (err) {
      if (currentView.current === id) setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getTopics(groupId)
      .then((list) => active && setTopics(list))
      .catch((err) => {
        if (!active) return;
        setTopics([]);
        setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  const openTopic = (id) => {
    goTo(id);
    setTopic(null);
    setReplyText("");
    loadTopic(id);
  };

  const backToList = () => {
    goTo("list");
    setError("");
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createTopic(groupId, { title: title.trim(), text: text.trim() });
      setTopics((prev) => [
        { id: created.id, title: created.title, author: created.author, replies: 0, lastActivity: created.date },
        ...(prev ?? []),
      ]);
      setTitle("");
      setText("");
      goTo(created.id);
      setTopic(created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const reply = await replyTopic(topic.id, replyText.trim());
      setTopic((prev) => ({ ...prev, replies: [...prev.replies, reply] }));
      // El tema sube al principio de la lista, igual que en el backend
      setTopics((prev) => {
        const current = prev?.find((t) => t.id === topic.id);
        if (!current) return prev;
        const updated = { ...current, replies: current.replies + 1, lastActivity: reply.date };
        return [updated, ...prev.filter((t) => t.id !== topic.id)];
      });
      setReplyText("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const refresh = () => (view === "list" ? loadTopics() : loadTopic(view));

  const errorBox = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  );

  // ---------- Nuevo tema ----------
  if (view === "new") {
    return (
      <form className="forum-form" onSubmit={onCreate}>
        <div className="panel-head">
          <button type="button" className="btn btn-ghost btn-sm" onClick={backToList}>
            <Icon name="arrowLeft" size={16} /> Temas
          </button>
          <h2>Nuevo tema</h2>
        </div>
        <label className="field">
          <span className="field-label">Título</span>
          <div className="input-wrap">
            <input
              placeholder="Ej. Guía 2 – Ejercicio 3"
              maxLength={MAX_TITLE_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </label>
        <label className="field">
          <span className="field-label">Pregunta o enunciado</span>
          <textarea
            rows={6}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Escribe el ejercicio o la duda para que el grupo responda aquí."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        {errorBox}
        <div className="forum-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={backToList}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!title.trim() || !text.trim() || saving}
          >
            {saving ? "Publicando…" : "Publicar tema"}
          </button>
        </div>
      </form>
    );
  }

  // ---------- Tema abierto ----------
  if (view !== "list") {
    return (
      <>
        <div className="panel-head">
          <button type="button" className="btn btn-ghost btn-sm" onClick={backToList}>
            <Icon name="arrowLeft" size={16} /> Temas
          </button>
          <h2 className="forum-title">{topic?.title ?? ""}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        <div className="forum-scroll">
          {topic === null ? (
            !error && <p className="muted small">Cargando tema…</p>
          ) : (
            <>
              <Post {...topic} user={user} />
              <h3 className="forum-replies-head">{plural(topic.replies.length, "respuesta", "respuestas")}</h3>
              <ol className="forum-replies" aria-label="Respuestas">
                {topic.replies.map((r) => (
                  <li key={r.id}>
                    <Post {...r} user={user} />
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {errorBox}

        {topic && (
          <form className="forum-reply" onSubmit={onReply}>
            <textarea
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Escribe tu respuesta…"
              aria-label="Tu respuesta"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!replyText.trim() || saving}>
              {saving ? "Enviando…" : "Responder"}
            </button>
          </form>
        )}
      </>
    );
  }

  // ---------- Lista de temas ----------
  return (
    <>
      <div className="panel-head">
        <Icon name="chat" size={18} />
        <h2>Foro del grupo</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => goTo("new")}>
          <Icon name="plus" size={16} /> Nuevo tema
        </button>
      </div>

      {errorBox}

      <div className="forum-scroll">
        {topics === null ? (
          <p className="muted small">Cargando temas…</p>
        ) : topics.length === 0 ? (
          !error && (
            <EmptyState icon="chat" title="Todavía no hay temas">
              Abre uno por ejercicio o duda, y el grupo responde ahí mismo.
            </EmptyState>
          )
        ) : (
          <ul className="forum-topics" aria-label="Temas del foro">
            {topics.map((t) => (
              <li key={t.id}>
                <button type="button" className="forum-topic" onClick={() => openTopic(t.id)}>
                  <strong>{t.title}</strong>
                  <span className="muted small">
                    {t.author} · {plural(t.replies, "respuesta", "respuestas")} · {t.lastActivity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
