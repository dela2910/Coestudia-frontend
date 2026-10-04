import { useState } from "react";
import AuthHero from "../components/AuthHero";
import Icon from "../components/Icon";

// Pantalla intermedia después de iniciar sesión: pide verificar el correo UC.
// Maqueta: no se envía ningún correo; "Ya verifiqué mi correo" deja pasar al resto de la app.
export default function VerifyEmail({ email, onVerified, onChangeEmail }) {
  const [resent, setResent] = useState(false);

  return (
    <div className="auth">
      <AuthHero />

      <main className="auth-panel">
        <div className="auth-card verify-card">
          <div className="verify-icon">
            <Icon name="mail" size={30} />
          </div>

          <div>
            <h2>Verifica tu correo</h2>
            <p className="muted">
              Te enviamos un enlace de verificación a{" "}
              <strong className="verify-email">{email}</strong>. Ábrelo para activar tu cuenta.
            </p>
          </div>

          <ol className="verify-steps">
            <li>
              <span className="step">1</span> Abre tu bandeja de entrada UC.
            </li>
            <li>
              <span className="step">2</span> Busca el correo de Coestudia (revisa también spam).
            </li>
            <li>
              <span className="step">3</span> Haz clic en el enlace y vuelve aquí.
            </li>
          </ol>

          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onVerified}>
            <Icon name="check" size={18} strokeWidth={2.4} /> Ya verifiqué mi correo
          </button>

          {resent ? (
            <p className="request-sent verify-resent">
              <span className="request-sent-text">
                <Icon name="check" size={18} strokeWidth={2.4} /> Te reenviamos el correo.
              </span>
            </p>
          ) : (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setResent(true)}>
              Reenviar correo
            </button>
          )}

          <p className="muted center small">
            ¿Te equivocaste de correo?{" "}
            <button type="button" className="link-btn" onClick={onChangeEmail}>
              Usar otro correo
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
