import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmail } from "../../lib/auth";

export function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          <span>Z</span>
        </div>

        <h1 className="zunary-auth-title">
          Entrar na <span className="zunary-gradient-text">Zunary</span>
        </h1>

        <p className="zunary-auth-subtitle">
          Agendamentos simples para negócios organizados.
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
          />
        </div>

        <div className="zunary-field">
          <label>Senha</label>
          <input
            className="zunary-input"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
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