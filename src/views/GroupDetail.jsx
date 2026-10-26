import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { getGroup } from "../api/groups";
import Icon from "../components/Icon";
import { Avatar, BackButton, CapacityBar, StatusBadge } from "../components/ui";
import { formatDate, meetingPoint, modalityLabel, scheduleLabel } from "../data/mock";

// summary: el grupo como viene del buscador. Mientras llega el detalle (integrantes, creador y,
// si eres integrante, el lugar o enlace) se muestran esos datos.
export default function GroupDetail({ group: summary, onEnter, onBack }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    let active = true;
    getGroup(summary.id)
      .then((group) => active && setDetail(group))
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [summary.id]);

  const group = detail ?? summary;
  const isMember = detail?.isMember ?? false;
  // isOpen viene del buscador; los grupos de ejemplo no lo traen
  const closed = group.isOpen === false;
  const full = group.members >= group.capacity;
  const freeSpots = group.capacity - group.members;

  return (
    <div className="page page-narrow">
      <BackButton onClick={onBack} />

      <article className="card detail">
        <header className="detail-head">
          <div>
            <span className="eyebrow">Grupo de estudio · {group.code}</span>
            <h1>{group.subject}</h1>
          </div>
          <StatusBadge members={group.members} capacity={group.capacity} open={!closed} />
        </header>

        <div className="info-grid">
          <div className="info">
            <Icon name={group.isOnline ? "monitor" : "mapPin"} size={20} />
            <div>
              <span className="info-label">Modalidad</span>
              <span>{modalityLabel(group.isOnline)}</span>
            </div>
          </div>
          <div className="info">
            <Icon name="calendar" size={20} />
            <div>
              <span className="info-label">Horario</span>
              <span>{scheduleLabel(group.schedule)}</span>
            </div>
          </div>
          {isMember && meetingPoint(group) && (
            <div className="info">
              <Icon name={group.isOnline ? "monitor" : "mapPin"} size={20} />
              <div>
                <span className="info-label">{group.isOnline ? "Enlace" : "Lugar"}</span>
                {group.isOnline ? (
                  <a href={group.link} target="_blank" rel="noreferrer">
                    {group.link}
                  </a>
                ) : (
                  <span>{group.place}</span>
                )}
              </div>
            </div>
          )}
          <div className="info">
            <Icon name="clock" size={20} />
            <div>
              <span className="info-label">Vigente hasta</span>
              <span>{formatDate(group.validUntil)}</span>
            </div>
          </div>
        </div>

        <section>
          <h2 className="section-title">Descripción</h2>
          <p>{group.description || "El creador no agregó una descripción."}</p>
        </section>

        <section>
          <div className="section-row">
            <h2 className="section-title">
              Integrantes ({group.members}/{group.capacity})
            </h2>
            <span className="muted small">
              {full
                ? "Sin cupos"
                : `${freeSpots} ${freeSpots === 1 ? "cupo libre" : "cupos libres"}`}
            </span>
          </div>
          <CapacityBar members={group.members} capacity={group.capacity} />
          {/* Los integrantes los trae el detalle del grupo; el buscador no los incluye */}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : detail ? (
            <ul className="member-list">
              {detail.integrants.map((m) => (
                <li key={m.id} className="member">
                  <Avatar name={m.name} />
                  <div>
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.career}</span>
                  </div>
                  {m.isOwner && <span className="badge badge-soft">Creador</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small" role="status">
              Cargando integrantes…
            </p>
          )}
        </section>

        <div className="detail-actions">
          {isMember ? (
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={() => onEnter(detail)}
            >
              <Icon name="chat" size={18} /> Abrir grupo
            </button>
          ) : error || full || closed ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
              {error ? "No disponible" : full ? "Grupo completo" : "Grupo cerrado"}
            </button>
          ) : requested ? (
            <div className="request-sent">
              <span className="request-sent-text">
                <Icon name="check" size={18} strokeWidth={2.4} /> Solicitud enviada. Te avisaremos
                cuando {group.owner ?? "el creador"} responda.
              </span>
              <button type="button" className="link-btn" onClick={() => setRequested(false)}>
                Cancelar solicitud
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={() => setRequested(true)}
            >
              Solicitar ingreso
            </button>
          )}
          {isMember ? (
            <p className="notice">
              <Icon name="users" size={16} />
              Ya eres integrante: dentro del grupo puedes compartir archivos y consultarlos con el
              asistente de estudio.
            </p>
          ) : (
            <p className="notice">
              <Icon name="lock" size={16} />
              El lugar exacto y el contacto de los integrantes se muestran solo cuando te aceptan.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
