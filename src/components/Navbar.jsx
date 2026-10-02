import Icon from "./Icon";
import { Avatar } from "./ui";

const LINKS = [
  { view: "home", label: "Buscar", icon: "search" },
  { view: "create", label: "Crear grupo", icon: "plus" },
  { view: "profile", label: "Mis grupos", icon: "users" },
];

export default function Navbar({ current, onNavigate, userName }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button type="button" className="brand" onClick={() => onNavigate("home")}>
          <span className="brand-mark">
            <Icon name="book" size={18} strokeWidth={2} />
          </span>
          Coestudia
        </button>
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((link) => (
            <button
              key={link.view}
              type="button"
              className={`nav-link ${current === link.view ? "nav-link-active" : ""}`}
              aria-current={current === link.view ? "page" : undefined}
              onClick={() => onNavigate(link.view)}
            >
              <Icon name={link.icon} size={18} />
              <span className="nav-label">{link.label}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="nav-avatar"
          aria-label="Mi perfil"
          onClick={() => onNavigate("profile")}
        >
          <Avatar name={userName} size="sm" />
        </button>
      </div>
    </header>
  );
}
