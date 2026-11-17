import { useEffect, useState } from "react";
import { getSuggestedSubjects } from "../api/suggestions";
import Icon from "./Icon";

// Espera antes de pedir sugerencias mientras el usuario escribe
const TYPING_DELAY_MS = 200;
const LIST_ID = "search-suggestions";

const groupsLabel = (n) => {
  if (n === 0) return "Sin grupos aún";
  return n === 1 ? "1 grupo" : `${n} grupos`;
};

// Barra del buscador con búsqueda sugerida: al enfocarla propone asignaturas con grupos
// disponibles y, mientras se escribe, autocompleta por sigla o nombre. Se maneja con el mouse o
// con las flechas, Enter y Escape (patrón combobox de ARIA).
export default function SearchBox({ query, onQueryChange, onPick }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  // Opción marcada con las flechas; -1 = ninguna (Enter busca el texto escrito)
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!open) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      getSuggestedSubjects(query)
        .then((result) => {
          if (!current) return;
          setSuggestions(result);
          setActive(-1);
        })
        .catch(() => current && setSuggestions([]));
    }, TYPING_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  const visible = open && suggestions.length > 0;

  const pick = (subject) => {
    setOpen(false);
    onPick(subject.code);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!visible) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      // Con una opción marcada, Enter la elige en vez de enviar el formulario
      e.preventDefault();
      pick(suggestions[active]);
    }
  };

  return (
    <div className="search-box">
      <div className="search-bar">
        <Icon name="search" size={22} />
        <input
          type="search"
          role="combobox"
          placeholder="Buscar por ramo o sigla… (ej: Cálculo II, MAT1620)"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          aria-label="Buscar asignatura"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={LIST_ID}
          aria-activedescendant={visible && active >= 0 ? `${LIST_ID}-${active}` : undefined}
        />
        <button type="submit" className="btn btn-primary">
          Buscar
        </button>
      </div>

      {visible && (
        <div className="search-suggestions">
          <p className="search-suggestions-title">
            {query.trim() ? "Asignaturas" : "Búsquedas sugeridas"}
          </p>
          <ul role="listbox" id={LIST_ID} aria-label="Asignaturas sugeridas">
            {suggestions.map((subject, i) => (
              <li
                key={subject.id}
                id={`${LIST_ID}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`search-suggestion ${i === active ? "is-active" : ""}`}
                // mousedown evita que el input pierda el foco (y se cierre la lista) antes del click
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(subject)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="subject-icon">
                  <Icon name={subject.reason ? "sparkles" : "book"} size={16} />
                </span>
                <span className="search-suggestion-text">
                  <span>
                    <strong>{subject.code}</strong> · {subject.name}
                  </span>
                  {subject.reason && <span className="muted small">{subject.reason}</span>}
                </span>
                <span
                  className={`search-suggestion-count ${subject.openGroups ? "" : "is-empty"}`}
                >
                  {groupsLabel(subject.openGroups)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
