// Hora en formato 24 horas con dos listas (hora y minutos). Reemplaza a <input type="time">,
// que según el idioma del sistema muestra AM/PM y es incómodo de llenar.
// value: "HH:MM" o "" (sin hora).

const pad = (n) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));
// De 5 en 5 minutos: cubre los horarios de clases sin una lista eterna
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

export default function TimeSelect({ value, onChange, label }) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];
  // Si llega un minuto que no está en la lista (ej. 10:07), igual se muestra
  const minutes =
    minute && !MINUTES.includes(minute)
      ? [...MINUTES, minute].sort((a, b) => a.localeCompare(b))
      : MINUTES;

  const setHour = (h) => onChange(h ? `${h}:${minute || "00"}` : "");
  const setMinute = (m) => onChange(`${hour || "00"}:${m}`);

  return (
    <span className="time-select" role="group" aria-label={label}>
      <select aria-label={`${label}, hora`} value={hour} onChange={(e) => setHour(e.target.value)}>
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span aria-hidden="true">:</span>
      <select
        aria-label={`${label}, minutos`}
        value={minute}
        disabled={!hour}
        onChange={(e) => setMinute(e.target.value)}
      >
        {!hour && <option value="">--</option>}
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </span>
  );
}
