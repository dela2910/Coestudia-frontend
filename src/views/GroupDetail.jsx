import { useState } from "react";
import Icon from "../components/Icon";
import { Avatar, BackButton, CapacityBar, StatusBadge } from "../components/ui";
import { blockLabel, dayLabel, modalityLabel } from "../data/mock";

export default function GroupDetail({ group, isMember = false, onEnter, onBack }) {
  const [requested, setRequested] = useState(false);
  const full = group.members >= group.capacity;
  const freeSpots = group.capacity - group.members;

  return (
    <div className="page page-narrow">
      <BackButton onClick={onBack} />

      <article className="card detail">
        <header className="detail-head">
          <div>
            <span className="eyebrow">Grupo de estudio</span>
            <h1>{group.subject}</h1>
          </div>
          <StatusBadge members={group.members} capacity={group.capacity} />
        </header>

        <div className="info-grid">
          <div className="info">
            <Icon name={group.modality === "online" ? "monitor" : "mapPin"} size={20} />
            <div>
              <span className="info-label">Modalidad</span>
              <span>{modalityLabel(group.modality)}</span>
            </div>
          </div>
          <div className="info">
            <Icon name="calendar" size={20} />
            <div>
              <span className="info-label">Día</span>
              <span>{dayLabel(group.day)}</span>
            </div>
          </div>
          <div className="info">
            <Icon name="clock" size={20} />
            <div>
              <span className="info-label">Bloque</span>
              <span>{blockLabel(group.block)}</span>
            </div>
          </div>
        </div>

        <section>
          <h2 className="section-title">Descripción</h2>
          <p>{group.description}</p>
        </section>

        <section>
          <div className="section-row">
            <h2 className="section-title">
              Integrantes ({group.members}/{group.capacity})
            </h2>
            <span className="muted small">
              {full ? "Sin cupos" : `${freeSpots} ${freeSpots === 1 ? "cupo libre" : "cupos libres"}`}
            </span>
          </div>
          <CapacityBar members={group.members} capacity={group.capacity} />
          <ul className="member-list">
            {group.integrants.map((m) => (
              <li key={m.name} className="member">
                <Avatar name={m.name} />
                <div>
                  <strong>{m.name}</strong>
                  <span className="muted small">{m.career}</span>
                </div>
                {m.name === group.owner && <span className="badge badge-soft">Creador</span>}
              </li>
            ))}
          </ul>
        </section>

        <div className="detail-actions">
          {isMember ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onEnter}>
              <Icon name="chat" size={18} /> Abrir grupo
            </button>
          ) : full ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
              Grupo completo
            </button>
          ) : requested ? (
            <div className="request-sent">
              <span className="request-sent-text">
                <Icon name="check" size={18} strokeWidth={2.4} /> Solicitud enviada. Te avisaremos
                cuando {group.owner} responda.
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
              Ya eres integrante: dentro del grupo puedes compartir archivos y consultarlos con el asistente de estudio.
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
