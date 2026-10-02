import Icon from "./Icon";

// Piezas de interfaz reutilizables entre vistas.

export function Avatar({ name, size = "md" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  // Tono determinístico según el nombre, siempre dentro de la gama celeste.
  const hue = 190 + ([...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 30);
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: `hsl(${hue} 85% 90%)`, color: `hsl(${hue} 70% 30%)` }}
      title={name}
    >
      {initials}
    </span>
  );
}

// Grupo de botones tipo "pastilla" para elegir una o varias opciones.
export function ToggleGroup({ options, value, onChange, multiple = false, label }) {
  const isActive = (id) => (multiple ? value.includes(id) : value === id);
  const toggle = (id) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange(value === id ? null : id);
    }
  };
  return (
    <div className="toggle-group" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`pill ${isActive(opt.id) ? "pill-active" : ""}`}
          aria-pressed={isActive(opt.id)}
          onClick={() => toggle(opt.id)}
        >
          {isActive(opt.id) && <Icon name="check" size={14} strokeWidth={2.4} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CapacityBar({ members, capacity }) {
  const full = members >= capacity;
  return (
    <div className="capacity">
      <div className="capacity-track">
        <div
          className={`capacity-fill ${full ? "capacity-full" : ""}`}
          style={{ width: `${(members / capacity) * 100}%` }}
        />
      </div>
      <span className="capacity-text">
        {members}/{capacity} cupos
      </span>
    </div>
  );
}

export function StatusBadge({ members, capacity }) {
  const full = members >= capacity;
  return (
    <span className={`badge ${full ? "badge-closed" : "badge-open"}`}>
      {full ? "Completo" : "Abierto"}
    </span>
  );
}

export function EmptyState({ icon = "search", title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function BackButton({ onClick, children = "Volver" }) {
  return (
    <button type="button" className="btn btn-ghost btn-back" onClick={onClick}>
      <Icon name="arrowLeft" size={18} />
      {children}
    </button>
  );
}
