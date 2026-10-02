import { useState } from "react";
import BackendStatus from "../components/BackendStatus";
import Icon from "../components/Icon";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="auth">
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

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Crear cuenta
            </button>
          </div>

          <div>
            <h2>{isLogin ? "¡Hola de nuevo! 👋" : "Crea tu cuenta"}</h2>
            <p className="muted">
              {isLogin
                ? "Ingresa con tu correo UC para continuar."
                : "Solo necesitas tu correo @uc.cl."}
            </p>
          </div>

          {!isLogin && (
            <label className="field">
              <span className="field-label">Nombre completo</span>
              <div className="input-wrap">
                <Icon name="user" size={18} />
                <input type="text" placeholder="Ej: Camila Pérez" />
              </div>
            </label>
          )}

          <label className="field">
            <span className="field-label">Correo UC</span>
            <div className="input-wrap">
              <Icon name="mail" size={18} />
              <input type="email" placeholder="nombre@uc.cl" autoComplete="email" />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Contraseña</span>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="input-action"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>

          {isLogin && (
            <button type="button" className="link-btn align-end">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <p className="muted center small">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setMode(isLogin ? "register" : "login")}
            >
              {isLogin ? "Crear cuenta" : "Inicia sesión"}
            </button>
          </p>

          <BackendStatus />
        </form>
      </main>
    </div>
  );
}
