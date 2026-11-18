import Icon from "./Icon";
import TimeSelect from "./TimeSelect";
import { DAYS, dayName } from "../data/mock";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Máximo de horarios por grupo (el backend acepta hasta 12)
const MAX_ROWS = 12;

// Horario nuevo: el día siguiente al último, con las mismas horas para no tener que reescribirlas
const nextRow = (rows) => {
  const last = rows.at(-1);
  if (!last) return { day: 0, start: "", end: "" };
  return { day: Math.min(last.day + 1, DAYS.length - 1), start: last.start, end: last.end };
};

// Horarios de un grupo: cada fila es un día con hora de inicio y fin.
// value: [{ day, start: "HH:MM", end: "HH:MM" }]
export default function ScheduleEditor({ value, onChange }) {
  const update = (index, field, fieldValue) =>
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: fieldValue } : row)));
  const remove = (index) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="schedule-editor">
      {value.map((row, i) => (
        <div key={i} className="schedule-row" role="group" aria-label={`Horario ${i + 1}`}>
          <select
            aria-label="Día"
            value={row.day}
            onChange={(e) => update(i, "day", Number(e.target.value))}
          >
            {DAYS.map((d) => (
              <option key={d.id} value={d.id}>
                {capitalize(dayName(d.id))}
              </option>
            ))}
          </select>
          <TimeSelect label="Inicio" value={row.start} onChange={(v) => update(i, "start", v)} />
          <span className="schedule-sep" aria-hidden="true">
            a
          </span>
          <TimeSelect label="Fin" value={row.end} onChange={(v) => update(i, "end", v)} />
          <button
            type="button"
            className="input-action"
            aria-label={`Quitar horario ${i + 1}`}
            disabled={value.length === 1}
            onClick={() => remove(i)}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}
      {value.length < MAX_ROWS && (
        <button
          type="button"
          className="btn btn-ghost btn-sm schedule-add"
          onClick={() => onChange([...value, nextRow(value)])}
        >
          <Icon name="plus" size={16} /> Agregar horario
        </button>
      )}
    </div>
  );
}
