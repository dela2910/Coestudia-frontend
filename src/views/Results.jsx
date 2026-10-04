import GroupCard from "../components/GroupCard";
import Icon from "../components/Icon";
import { BackButton, EmptyState } from "../components/ui";
import { filterGroups } from "../data/filters";
import { blockLabel, dayLabel, modalityLabel } from "../data/mock";

export default function Results({ groups, filters, onBack, onOpen, onCreate }) {
  const results = filterGroups(groups, filters);
  // Los grupos con cupo disponible aparecen primero.
  const sorted = [...results].sort(
    (a, b) => Number(a.members >= a.capacity) - Number(b.members >= b.capacity),
  );

  const chips = [
    filters.query && `“${filters.query}”`,
    filters.modality && modalityLabel(filters.modality),
    ...filters.days.map(dayLabel),
    ...filters.blocks.map(blockLabel),
  ].filter(Boolean);

  return (
    <div className="page">
      <BackButton onClick={onBack}>Modificar búsqueda</BackButton>

      <div className="page-head">
        <div>
          <h1>Resultados</h1>
          <p className="muted">
            {results.length === 1
              ? "Encontramos 1 grupo"
              : `Encontramos ${results.length} grupos`}
          </p>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="chip-row">
          {chips.map((chip) => (
            <span key={chip} className="chip">
              {chip}
            </span>
          ))}
        </div>
      )}

      {sorted.length > 0 ? (
        <>
          <div className="group-grid">
            {sorted.map((group) => (
              <GroupCard key={group.id} group={group} onOpen={onOpen} />
            ))}
          </div>
          <p className="muted center small results-foot">
            ¿Ninguno te acomoda?{" "}
            <button type="button" className="link-btn" onClick={onCreate}>
              Crea tu propio grupo
            </button>
          </p>
        </>
      ) : (
        <EmptyState
          title="Aún no hay grupos con esos filtros"
          action={
            <button type="button" className="btn btn-primary" onClick={onCreate}>
              <Icon name="plus" size={18} /> Crear grupo
            </button>
          }
        >
          Sé el primero en armar uno: otros estudiantes podrán encontrarlo y sumarse.
        </EmptyState>
      )}
    </div>
  );
}
