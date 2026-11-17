import { useEffect, useState } from "react";
import { getSuggestedGroups } from "../api/suggestions";
import GroupCard from "./GroupCard";

// «Sugeridos para ti»: grupos con cupo que calzan con las asignaturas, la carrera y los horarios
// del usuario, con el motivo de cada sugerencia. Si no hay sugerencias o falla la carga, la
// sección no aparece: el buscador sigue funcionando igual.
export default function SuggestedGroups({ onOpen }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let current = true;
    getSuggestedGroups()
      .then((result) => current && setGroups(result))
      .catch(() => {
        // Las sugerencias son un extra: sin ellas el inicio funciona igual
      });
    return () => {
      current = false;
    };
  }, []);

  if (groups.length === 0) return null;

  return (
    <section className="section" aria-labelledby="suggested-title">
      <h2 className="section-title" id="suggested-title">
        Sugeridos para ti
      </h2>
      <p className="muted small">
        Grupos con cupo según tus ramos, tu carrera y tus horarios.
      </p>
      <div className="group-grid">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onOpen={() => onOpen(group)}
            footer={
              <ul className="suggestion-reasons" aria-label="Por qué te lo sugerimos">
                {group.reasons.map((reason) => (
                  <li key={reason} className="chip chip-soft">
                    {reason}
                  </li>
                ))}
              </ul>
            }
          />
        ))}
      </div>
    </section>
  );
}
