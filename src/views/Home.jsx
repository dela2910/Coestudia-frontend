import { useState } from "react";
import Icon from "../components/Icon";
import SearchBox from "../components/SearchBox";
import SuggestedGroups from "../components/SuggestedGroups";
import TimeSelect from "../components/TimeSelect";
import { ToggleGroup } from "../components/ui";
import { DAYS, MODALITIES } from "../data/mock";

export default function Home({ user, initialFilters, onSearch, onOpen, onCreate }) {
  const [query, setQuery] = useState(initialFilters.query);
  const [isOnline, setIsOnline] = useState(initialFilters.isOnline);
  const [days, setDays] = useState(initialFilters.days);
  // Rango de horas "HH:MM"; vacío = sin límite
  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);

  const firstName = user.name.split(" ")[0];
  const hasFilters = isOnline !== null || days.length > 0 || from || to;
  const badRange = from && to && to <= from;

  const search = (overrideQuery) => {
    if (badRange) return;
    onSearch({ query: overrideQuery ?? query, isOnline, days, from, to });
  };

  const clearFilters = () => {
    setIsOnline(null);
    setDays([]);
    setFrom("");
    setTo("");
  };

  return (
    <div className="page">
      <section className="hero">
        <h1>Hola, {firstName} 👋</h1>
        <p className="muted">¿Qué quieres estudiar hoy? Encuentra un grupo o arma el tuyo.</p>
      </section>

      <form
        className="card search-card"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <SearchBox
          query={query}
          onQueryChange={setQuery}
          onPick={(code) => {
            setQuery(code);
            search(code);
          }}
        />

        <div className="filters">
          <div className="filter">
            <span className="filter-label">Modalidad</span>
            <ToggleGroup
              label="Modalidad"
              options={MODALITIES}
              value={isOnline}
              onChange={setIsOnline}
            />
          </div>
          <div className="filter">
            <span className="filter-label">Día</span>
            <ToggleGroup label="Día" options={DAYS} value={days} onChange={setDays} multiple />
          </div>
          <div className="filter">
            <span className="filter-label">Horario</span>
            <div className="time-range">
              <span className="time-field">
                Desde <TimeSelect label="Desde" value={from} onChange={setFrom} />
              </span>
              <span className="time-field">
                Hasta <TimeSelect label="Hasta" value={to} onChange={setTo} />
              </span>
            </div>
          </div>
        </div>
        {badRange && (
          <p className="form-error" role="alert">
            La hora «Hasta» debe ser después de «Desde».
          </p>
        )}

        {hasFilters && (
          <button type="button" className="link-btn small" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </form>

      <SuggestedGroups onOpen={onOpen} />

      <section className="section">
        <h2 className="section-title">Tus ramos</h2>
        <p className="muted small">
          {user.subjects.length > 0
            ? "Toca uno para ver sus grupos al tiro."
            : "Agrega las asignaturas que cursas en Mis grupos y aparecerán aquí."}
        </p>
        <div className="subject-grid">
          {user.subjects.map(({ code, name }) => (
            <button
              key={code}
              type="button"
              className="subject-tile"
              onClick={() => {
                setQuery(code);
                search(code);
              }}
            >
              <span className="subject-icon">
                <Icon name="book" size={18} />
              </span>
              <span className="subject-tile-text">
                <span>{name}</span>
                <span className="subject-code">{code}</span>
              </span>
              <Icon name="chevronRight" size={18} className="subject-arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="cta-card">
        <div className="cta-icon">
          <Icon name="sparkles" size={24} />
        </div>
        <div className="cta-text">
          <h3>¿No encuentras un grupo que te acomode?</h3>
          <p className="muted">Crea uno con tus horarios y deja que otros se sumen.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onCreate}>
          <Icon name="plus" size={18} /> Crear grupo
        </button>
      </section>
    </div>
  );
}
