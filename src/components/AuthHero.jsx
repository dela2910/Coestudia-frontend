import Icon from "./Icon";

// Panel celeste de la izquierda en las pantallas de acceso (login y verificación).
export default function AuthHero() {
  return (
    <aside className="auth-hero">
      <div className="brand brand-light">
        <span className="brand-mark">
          <Icon name="book" size={18} strokeWidth={2} />
        </span>
        Coestudia
      </div>
      <div>
        <h1>Estudia acompañado, rinde mejor.</h1>
        <p>
          Encuentra compañeros de tu universidad que estén cursando tus mismos ramos y armen
          grupos de estudio en el horario que les acomode.
        </p>
        <ul className="auth-points">
          <li>
            <Icon name="search" size={18} /> Busca grupos por ramo, día y modalidad
          </li>
          <li>
            <Icon name="users" size={18} /> Crea tu propio grupo en segundos
          </li>
          <li>
            <Icon name="lock" size={18} /> Tu contacto solo lo ven tus compañeros de grupo
          </li>
        </ul>
      </div>
    </aside>
  );
}
