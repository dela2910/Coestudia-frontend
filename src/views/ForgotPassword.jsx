import { useState } from "react";
import { requestPasswordReset } from "../api/auth";
import { errorMessage } from "../api/client";
import AuthHero from "../components/AuthHero";
import Icon from "../components/Icon";

// Pide el enlace para elegir una contraseña nueva (B04). El backend responde lo mismo exista o no
// la cuenta, así que la pantalla siempre dice "si existe, te enviamos el correo".
// initialEmail: el correo que ya estaba escrito en el inicio de sesión
export default function ForgotPassword({ initialEmail = "", onBackToLogin }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const typedEmail = email.trim();
    if (!typedEmail) {
      setError("Ingresa tu correo.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await requestPasswordReset(typedEmail);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth">
      <AuthHero />

      <main className="auth-panel">
        <form className="auth-card verify-card" onSubmit={handleSubmit}>
          <div className="verify-icon">
            <Icon name="lock" size={30} />
          </div>

          <div>
            <h2>Recupera tu contraseña</h2>
            <p className="muted">
              {sent ? (
                <>
                  Si existe una cuenta con <strong className="verify-email">{email.trim()}</strong>,
                  te enviamos un enlace para elegir una contraseña nueva. Vence en 1 hora.
                </>
              ) : (
                "Escribe tu correo UC y te enviaremos un enlace para elegir una contraseña nueva."
              )}
            </p>
          </div>

          {!sent && (
            <label className="field">
              <span className="field-label">Correo UC</span>
              <div className="input-wrap">
                <Icon name="mail" size={18} />
                <input
                  type="email"
                  placeholder="nombre@uc.cl"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {sent ? (
            <p className="request-sent verify-resent">
              <span className="request-sent-text">
                <Icon name="check" size={18} strokeWidth={2.4} /> Revisa tu bandeja (y el spam).
              </span>
            </p>
          ) : (
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending}>
              {sending ? "Enviando…" : "Enviar enlace"}
            </button>
          )}

          <p className="muted center small">
            <button type="button" className="link-btn" onClick={onBackToLogin}>
              Volver a iniciar sesión
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
