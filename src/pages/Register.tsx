import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { RegisterForm } from "../components/auth/RegisterForm";

export function Register() {
  return (
    <div className="zunary-auth-page">
      <Link to="/" className="zunary-auth-back-button zunary-auth-back-floating">
        <ArrowLeft size={16} />
        Voltar para o site
      </Link>

      <div className="zunary-auth-beta-layout">
        <section className="zunary-auth-beta-copy">
          <span>Beta gratuito</span>

          <h1>Teste a Zunary no seu negócio local.</h1>

          <p>
            Crie sua conta, cadastre sua empresa, adicione serviços, defina
            horários e gere uma página pública para seus clientes agendarem.
          </p>

          <div className="zunary-auth-beta-list">
            <div>
              <CheckCircle2 size={18} />
              <strong>Página própria de agendamento</strong>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <strong>Serviços, horários e clientes organizados</strong>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <strong>Painel para acompanhar solicitações recebidas</strong>
            </div>
          </div>

          <small>
            A primeira versão está em fase beta. Algumas vagas estão sendo
            liberadas para negócios testarem gratuitamente.
          </small>
        </section>

        <div className="zunary-auth-shell">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}