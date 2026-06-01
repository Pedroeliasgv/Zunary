import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "../components/auth/LoginForm";

export function Login() {
  return (
    <div className="zunary-login-simple-page">
      <div className="zunary-login-simple-shell">
        <Link to="/" className="zunary-login-simple-back">
          <ArrowLeft size={16} />
          Voltar para o site
        </Link>

        <div className="zunary-login-simple-card">
          <div className="zunary-login-simple-brand">
            <img src="/logo-zunary.png" alt="Zunary" />
            <strong>Zunary</strong>
          </div>

          <div className="zunary-login-simple-header">
            <span>Painel de agendamentos</span>
            <h1>Entrar na sua conta</h1>
            <p>
              Acesse seu painel para gerenciar serviços, horários e
              agendamentos.
            </p>
          </div>

          <LoginForm />

          <div className="zunary-login-simple-footer">
            <span>Ainda não tem conta?</span>
            <Link to="/register">Criar conta gratuita</Link>
          </div>
        </div>
      </div>
    </div>
  );
}