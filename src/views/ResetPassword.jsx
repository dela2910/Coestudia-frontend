import { useState } from "react";
import { resetPassword } from "../api/auth";
import { errorMessage } from "../api/client";
import AuthHero from "../components/AuthHero";
import Icon from "../components/Icon";
import { PASSWORD_RULES, passwordIsStrong, passwordTooLong } from "../data/password";

// Elegir una contraseña nueva desde el enlace del correo (<frontend>/?restablecer=<token>).
// Al terminar se vuelve al inicio de sesión: el cambio cierra todas las sesiones abiertas.
export default function ResetPassword({ token, onDone, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const validationError = () => {
    if (!password || !confirmation) return "Completa ambos campos.";
    if (!passwordIsStrong(password)) return "La contraseña debe cumplir todos los requisitos.";
    if (passwordTooLong(password)) return "La contraseña es demasiado larga.";
    if (password !== confirmation) return "Las contraseñas no coinciden.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validationError();
    setError(message);
    if (message) return;

    setSaving(true);
    try {
      const { message: done } = await resetPassword(token, password);
      onDone(done);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="auth">
      <AuthHero />

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <h2>Elige una contraseña nueva</h2>
            <p className="muted">Al cambiarla se cerrarán las sesiones abiertas en otros equipos.</p>
          </div>

          <label className="field">
            <span className="field-label">Contraseña nueva</span>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-label="Contraseña nueva"
                autoFocus
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
          </label>

          <label className="field">
            <span className="field-label">Repite la contraseña</span>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-label="Repite la contraseña"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
            {saving ? "Guardando…" : "Cambiar contraseña"}
          </button>

          <p className="muted center small">
            <button type="button" className="link-btn" onClick={onCancel}>
              Volver a iniciar sesión
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
