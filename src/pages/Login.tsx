import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LoginForm } from "../components/auth/LoginForm";

export function Login() {
  return (
    <div className="zunary-auth-page zunary-login-page">
      <div className="zunary-login-layout">
        <section className="zunary-login-brand-panel">
          <Link to="/" className="zunary-login-brand">
            <img src="/logo-zunary.png" alt="Zunary" />
            <strong>Zunary</strong>
          </Link>

          <div className="zunary-login-copy">
            <span>Bem-vindo de volta</span>

            <h1>Entre no seu painel de agendamentos.</h1>

            <p>
              Acompanhe solicitações, organize serviços, defina horários e
              mantenha sua agenda online sempre pronta para seus clientes.
            </p>
          </div>

          <div className="zunary-login-benefits">
            <div>
              <CalendarDays size={19} />
              <span>Agendamentos centralizados</span>
            </div>

            <div>
              <Clock size={19} />
              <span>Horários organizados</span>
            </div>

            <div>
              <ShieldCheck size={19} />
              <span>Painel seguro para sua empresa</span>
            </div>
          </div>

          <div className="zunary-login-mini-preview">
            <div>
              <span>Hoje</span>
              <strong>8 agendamentos</strong>
            </div>

            <div>
              <span>Próximo horário</span>
              <strong>10:30</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>Agenda ativa</strong>
            </div>
          </div>
        </section>

        <section className="zunary-login-form-panel">
          <div className="zunary-login-form-top">
            <div className="zunary-logo-mark">
              <img src="/logo-zunary.png" alt="Zunary" />
            </div>

            <span>Acesso ao painel</span>

            <h2>Entrar na Zunary</h2>

            <p>
              Use seu e-mail e senha para acessar sua conta e continuar
              configurando sua agenda online.
            </p>
          </div>

          <div className="zunary-login-form-box">
            <LoginForm />
          </div>

          <div className="zunary-login-register-callout">
            <Sparkles size={17} />

            <span>Ainda não tem conta?</span>

            <Link to="/register">Criar conta gratuita</Link>
          </div>
        </section>
      </div>
    </div>
  );
}