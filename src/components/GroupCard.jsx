import { modalityLabel, scheduleLabel } from "../data/mock";
import Icon from "./Icon";
import { CapacityBar, StatusBadge } from "./ui";

export default function GroupCard({ group, onOpen, footer, ctaLabel = "Ver detalle" }) {
  const full = group.members >= group.capacity || group.isOpen === false;
  return (
    <article className={`group-card ${full ? "group-card-full" : ""}`}>
      <button type="button" className="group-card-main" onClick={() => onOpen(group.id)}>
        <div className="group-card-head">
          <h3>{group.subject}</h3>
          <StatusBadge members={group.members} capacity={group.capacity} open={group.isOpen} />
        </div>
        <div className="meta">
          <span className="meta-item">
            <Icon name={group.isOnline ? "monitor" : "mapPin"} size={16} />
            {modalityLabel(group.isOnline)}
          </span>
          <span className="meta-item">
            <Icon name="calendar" size={16} />
            {scheduleLabel(group.schedule)}
          </span>
        </div>
        <CapacityBar members={group.members} capacity={group.capacity} />
        <span className="group-card-cta">
          {ctaLabel} <Icon name="chevronRight" size={16} />
        </span>
      </button>
      {footer}
    </article>
  );
}
