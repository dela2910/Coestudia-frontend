import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications, markNotificationsSeen, notificationText, timeAgo } from "../api/notifications";
import Icon from "./Icon";

// Cada cuánto se revisa si hay notificaciones nuevas mientras la pestaña está abierta
const POLL_MS = 60_000;

// Campana del menú con el número de notificaciones nuevas y la lista desplegable.
// refreshKey: al cambiar (ej. la vista actual) se vuelven a pedir, para que el número se
// actualice después de aceptar una solicitud o una invitación.
export default function Notifications({ onOpen, refreshKey }) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const wrapper = useRef(null);

  const load = useCallback(() => {
    getNotifications()
      .then((data) => {
        setUnread(data.unread);
        setItems(data.items);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  // Se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      // Al abrir, el número se borra; los puntos de «nueva» se mantienen hasta volver a cargar
      setUnread(0);
      markNotificationsSeen().catch(() => {
        // Si falla, la próxima carga vuelve a mostrar el número
      });
    }
  };

  const choose = (item) => {
    setOpen(false);
    onOpen(item);
  };

  const label =
    unread > 0 ? `Notificaciones (${unread} ${unread === 1 ? "nueva" : "nuevas"})` : "Notificaciones";

  return (
    <div className="notifications" ref={wrapper}>
      <button
        type="button"
        className={`nav-bell ${open ? "nav-bell-open" : ""}`}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="nav-bell-count" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="notifications-panel" role="region" aria-label="Notificaciones">
          <p className="notifications-title">Notificaciones</p>
          {error && !items ? (
            <p className="notifications-empty">No pudimos cargar tus notificaciones.</p>
          ) : !items ? (
            <p className="notifications-empty">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="notifications-empty">No tienes notificaciones por ahora.</p>
          ) : (
            <ul className="notifications-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification ${item.isNew ? "notification-new" : ""}`}
                    onClick={() => choose(item)}
                  >
                    <span className="notification-text">{notificationText(item)}</span>
                    <span className="notification-time">{timeAgo(item.date)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
