import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { searchGroups } from "../api/groups";
import GroupCard from "../components/GroupCard";
import Icon from "../components/Icon";
import { BackButton, EmptyState } from "../components/ui";
import { blockLabel, dayLabel, modalityLabel } from "../data/mock";

export default function Results({ filters, onBack, onOpen, onCreate }) {
  // status: "loading" | "success" | "error"
  const [status, setStatus] = useState("loading");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  // Cambiar este número vuelve a pedir los resultados (botón "Reintentar")
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Si los filtros cambian antes de que llegue la respuesta, se ignora la anterior
    let current = true;
    searchGroups(filters)
      .then((groups) => {
        if (!current) return;
        setResults(groups);
        setStatus("success");
      })
      .catch((err) => {
        if (!current) return;
        setError(errorMessage(err));
        setStatus("error");
      });
    return () => {
      current = false;
    };
  }, [filters, attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const chips = [
    filters.query && `“${filters.query}”`,
    filters.isOnline !== null && modalityLabel(filters.isOnline),
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
            {status === "loading" && "Buscando grupos…"}
            {status === "error" && "No pudimos cargar los grupos"}
            {status === "success" &&
              (results.length === 1
                ? "Encontramos 1 grupo"
                : `Encontramos ${results.length} grupos`)}
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

      {status === "error" && (
        <EmptyState
          icon="search"
          title="Algo salió mal"
          action={
            <button type="button" className="btn btn-primary" onClick={retry}>
              Reintentar
            </button>
          }
        >
          {error}
        </EmptyState>
      )}

      {status === "success" &&
        (results.length > 0 ? (
          <>
            {/* El backend ya los ordena: primero los que aceptan integrantes */}
            <div className="group-grid">
              {results.map((group) => (
                <GroupCard key={group.id} group={group} onOpen={() => onOpen(group)} />
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
        ))}
    </div>
  );
}
