import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmail } from "../../lib/auth";

export function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      await signInWithEmail({ email, password });

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao fazer login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="zunary-auth-card">
      <div>
        <div className="zunary-logo-mark">
          <img src="/logo-zunary.png" alt="Zunary" />
        </div>

        <h1 className="zunary-auth-title">Entrar</h1>

        <p className="zunary-auth-subtitle">
          Acesse seu painel de agendamentos.
        </p>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="zunary-form">
        <div className="zunary-field">
          <label>E-mail</label>
          <input
            className="zunary-input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="zunary-field">
          <label>Senha</label>

          <div className="zunary-password-field">
            <input
              className="zunary-input"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button className="zunary-button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="zunary-auth-footer">
        Ainda não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </div>
  );
}