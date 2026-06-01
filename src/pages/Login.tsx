import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export function Login() {
  return (
    <div className="zunary-login-clean-page">
      <header className="zunary-login-clean-top">
        <Link to="/" className="zunary-login-clean-brand">
          <img src="/logo-zunary.png" alt="Zunary" />
          <strong>Zunary</strong>
        </Link>

        <Link to="/register" className="zunary-login-clean-register">
          Criar conta
        </Link>
      </header>

      <main className="zunary-login-clean-main">
        <section className="zunary-login-clean-copy">
          <span>Painel Zunary</span>
          <h1>Bem-vindo de volta.</h1>
          <p>Continue organizando seus serviços, horários e agendamentos.</p>
        </section>

        <section className="zunary-login-clean-form">
          <LoginForm />
        </section>
      </main>

      <footer className="zunary-login-clean-footer">
        <span>Agendamentos online simples para negócios locais.</span>
      </footer>
    </div>
  );
}