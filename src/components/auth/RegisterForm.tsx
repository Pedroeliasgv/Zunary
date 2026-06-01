import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpWithEmail } from "../../lib/auth";

export function RegisterForm() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await signUpWithEmail({
        fullName,
        email,
        password,
      });

      setSuccessMessage("Conta criada com sucesso. Agora faça login.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar conta."
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

        <h1 className="zunary-auth-title">
          Criar conta
        </h1>

        <p className="zunary-auth-subtitle">
          Comece a organizar seus serviços, horários e agendamentos.
        </p>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}
      {successMessage && <div className="zunary-success">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="zunary-form">
        <div className="zunary-field">
          <label>Nome completo</label>
          <input
            className="zunary-input"
            type="text"
            placeholder="Seu nome"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>

        <button className="zunary-button" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="zunary-auth-footer">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}