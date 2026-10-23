import { useState } from "react";
import { login, register } from "../api/auth";
import { ApiError, errorMessage } from "../api/client";
import AuthHero from "../components/AuthHero";
import BackendStatus from "../components/BackendStatus";
import Icon from "../components/Icon";
import { universityFromEmail } from "../data/universities";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_ENTRY_YEAR = 1990;
const MIN_PASSWORD = 8;
// bcrypt (backend) usa solo los primeros 72 bytes
const MAX_PASSWORD_BYTES = 72;

// Mismas reglas que valida el backend (app/schemas.py)
const PASSWORD_RULES = [
  { label: `${MIN_PASSWORD} caracteres o más`, test: (p) => p.length >= MIN_PASSWORD },
  { label: "Una mayúscula", test: (p) => p !== p.toLowerCase() },
  { label: "Una minúscula", test: (p) => p !== p.toUpperCase() },
  { label: "Un número", test: (p) => /\d/.test(p) },
];

// notice: aviso que llega desde fuera (ej. el enlace de verificación ya expiró)
// draft: datos de un registro anterior para corregir el correo sin llenar todo de nuevo
export default function Login({ onLoggedIn, onNeedsVerification, notice = "", draft = null }) {
  const [mode, setMode] = useState(draft ? "register" : "login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(draft?.name ?? "");
  const [career, setCareer] = useState(draft?.career ?? "");
  const [entryYear, setEntryYear] = useState(draft?.entryYear ?? "");
  // USUARIO.terminos_aceptados_en: sin aceptar los términos no se puede crear la cuenta
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(notice);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";
  const university = universityFromEmail(email);

  // El backend repite estas mismas validaciones; aquí se revisan antes para avisar al tiro.
  const registerError = () => {
    if (!name.trim() || !email.trim() || !career.trim() || !entryYear || !password) {
      return "Completa todos los campos.";
    }
    if (!university) return "Por ahora solo se aceptan correos @uc.cl.";
    if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
      return "La contraseña debe cumplir todos los requisitos.";
    }
    if (passwordTooLong()) return "La contraseña es demasiado larga.";
    const year = Number(entryYear);
    if (year < MIN_ENTRY_YEAR || year > CURRENT_YEAR) {
      return `El año de ingreso debe estar entre ${MIN_ENTRY_YEAR} y ${CURRENT_YEAR}.`;
    }
    if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
    return "";
  };

  const passwordTooLong = () => new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES;

  const loginError = () => {
    if (!email.trim() || !password) return "Ingresa tu correo y tu contraseña.";
    if (passwordTooLong()) return "La contraseña es demasiado larga.";
    return "";
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const typedEmail = email.trim();
    const message = isLogin ? loginError() : registerError();
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      if (isLogin) {
        onLoggedIn(await login(typedEmail, password));
      } else {
        await register({ email: typedEmail, password, name, career, entryYear, acceptedTerms });
        // Se guardan los datos (sin la contraseña) por si hay que corregir el correo
        onNeedsVerification(typedEmail, { name, career, entryYear });
      }
    } catch (err) {
      // 403: la cuenta existe pero aún no verifica el correo
      if (isLogin && err instanceof ApiError && err.status === 403) {
        onNeedsVerification(typedEmail);
        return;
      }
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <AuthHero />

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? "active" : ""}
              onClick={() => switchMode("register")}
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
                <input
                  type="text"
                  placeholder="Ej: Camila Pérez"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </label>
          )}

          <label className="field">
            <span className="field-label">Correo UC</span>
            <div className="input-wrap">
              <Icon name="mail" size={18} />
              <input
                type="email"
                placeholder="nombre@uc.cl"
                autoComplete="email"
                autoFocus={Boolean(draft)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isLogin && university && (
              <span className="field-note">
                <Icon name="check" size={14} strokeWidth={2.4} /> {university}
              </span>
            )}
          </label>

          {!isLogin && (
            <div className="field-row">
              <label className="field">
                <span className="field-label">Carrera</span>
                <div className="input-wrap">
                  <Icon name="book" size={18} />
                  <input
                    type="text"
                    placeholder="Ej: Ingeniería Civil"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                  />
                </div>
              </label>
              <label className="field">
                <span className="field-label">Año de ingreso</span>
                <div className="input-wrap">
                  <Icon name="calendar" size={18} />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={String(CURRENT_YEAR)}
                    min={MIN_ENTRY_YEAR}
                    max={CURRENT_YEAR}
                    value={entryYear}
                    onChange={(e) => setEntryYear(e.target.value)}
                  />
                </div>
              </label>
            </div>
          )}

          <label className="field">
            <span className="field-label">Contraseña</span>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {!isLogin && (
              <ul className="password-rules" aria-label="Requisitos de la contraseña">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.label} className={ok ? "rule-ok" : ""}>
                      <Icon name={ok ? "check" : "minus"} size={14} strokeWidth={2.4} />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </label>

          {!isLogin && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                Acepto los términos y condiciones y que mis datos se usen solo para coordinar
                grupos de estudio (Ley 19.628).
              </span>
            </label>
          )}

          {isLogin && (
            <button type="button" className="link-btn align-end">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? "Un momento…" : isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <p className="muted center small">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode(isLogin ? "register" : "login")}
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
