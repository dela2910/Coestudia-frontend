import { useState } from "react";
import Icon from "../components/Icon";
import { ToggleGroup } from "../components/ui";
import { BLOCKS, DAYS, MODALITIES } from "../data/mock";

export default function Home({ user, initialFilters, onSearch, onCreate }) {
  const [query, setQuery] = useState(initialFilters.query);
  const [modality, setModality] = useState(initialFilters.modality);
  const [days, setDays] = useState(initialFilters.days);
  const [blocks, setBlocks] = useState(initialFilters.blocks);

  const firstName = user.name.split(" ")[0];
  const hasFilters = modality || days.length > 0 || blocks.length > 0;

  const search = (overrideQuery) =>
    onSearch({ query: overrideQuery ?? query, modality, days, blocks });

  const clearFilters = () => {
    setModality(null);
    setDays([]);
    setBlocks([]);
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
        <div className="search-bar">
          <Icon name="search" size={22} />
          <input
            type="search"
            placeholder="Buscar asignatura… (ej: Cálculo II)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar asignatura"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </div>

        <div className="filters">
          <div className="filter">
            <span className="filter-label">Modalidad</span>
            <ToggleGroup
              label="Modalidad"
              options={MODALITIES}
              value={modality}
              onChange={setModality}
            />
          </div>
          <div className="filter">
            <span className="filter-label">Día</span>
            <ToggleGroup label="Día" options={DAYS} value={days} onChange={setDays} multiple />
          </div>
          <div className="filter">
            <span className="filter-label">Bloque</span>
            <ToggleGroup
              label="Bloque"
              options={BLOCKS}
              value={blocks}
              onChange={setBlocks}
              multiple
            />
          </div>
        </div>

        {hasFilters && (
          <button type="button" className="link-btn small" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </form>

      <section className="section">
        <h2 className="section-title">Tus ramos</h2>
        <p className="muted small">Toca uno para ver sus grupos al tiro.</p>
        <div className="subject-grid">
          {user.subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              className="subject-tile"
              onClick={() => {
                setQuery(subject);
                search(subject);
              }}
            >
              <span className="subject-icon">
                <Icon name="book" size={18} />
              </span>
              <span>{subject}</span>
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
