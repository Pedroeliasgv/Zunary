import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Scissors,
  Smartphone,
} from "lucide-react";

export function Home() {
  return (
    <div className="zunary-home">
      <header className="zunary-home-header">
        <div className="zunary-home-brand">
          <div>Z</div>
          <strong>Zunary</strong>
        </div>

        <nav>
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem é</a>
          <Link to="/login">Entrar</Link>
          <Link to="/register" className="zunary-home-nav-cta">
            Testar grátis
          </Link>
        </nav>
      </header>

      <main>
        <section className="zunary-home-hero">
          <div>
            <span>Agendamento online para negócios locais</span>

            <h1>Organize seus agendamentos sem bagunça no WhatsApp.</h1>

            <p>
              A Zunary ajuda barbearias, salões, estúdios, clínicas e
              profissionais autônomos a receberem agendamentos em uma página
              própria, simples e profissional.
            </p>

            <div className="zunary-home-actions">
              <Link to="/register" className="zunary-home-button">
                Quero testar gratuitamente
              </Link>

              <a href="#como-funciona" className="zunary-home-button secondary">
                Ver como funciona
              </a>
            </div>
          </div>

          <div className="zunary-home-preview">
            <div className="zunary-home-preview-card">
              <div className="zunary-home-preview-top">
                <span>Barbearia Modelo</span>
                <strong>Agendamento online</strong>
              </div>

              <div className="zunary-home-preview-service">
                <Scissors size={18} />
                <div>
                  <strong>Corte masculino</strong>
                  <span>30 min • R$ 50</span>
                </div>
              </div>

              <div className="zunary-home-preview-grid">
                <button>09:00</button>
                <button>09:30</button>
                <button className="active">10:00</button>
                <button>10:30</button>
              </div>

              <div className="zunary-home-preview-confirm">
                Agendamento solicitado
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="zunary-home-section">
          <div className="zunary-home-section-header">
            <span>Como funciona</span>
            <h2>Seu cliente agenda em poucos passos.</h2>
            <p>
              Você configura os serviços e horários. O cliente escolhe o melhor
              horário e você acompanha tudo no painel.
            </p>
          </div>

          <div className="zunary-home-steps">
            <div>
              <Scissors size={22} />
              <strong>Cadastre serviços</strong>
              <p>Adicione nome, duração e preço de cada serviço.</p>
            </div>

            <div>
              <Clock size={22} />
              <strong>Defina horários</strong>
              <p>Escolha os dias e horários disponíveis para atendimento.</p>
            </div>

            <div>
              <LinkIcon size={22} />
              <strong>Compartilhe o link</strong>
              <p>Envie sua página pública para clientes agendarem.</p>
            </div>

            <div>
              <CalendarDays size={22} />
              <strong>Acompanhe no painel</strong>
              <p>Confirme, conclua ou cancele solicitações recebidas.</p>
            </div>
          </div>
        </section>

        <section id="para-quem" className="zunary-home-section">
          <div className="zunary-home-section-header">
            <span>Para quem é</span>
            <h2>Feita para negócios que vivem de horário marcado.</h2>
          </div>

          <div className="zunary-home-segments">
            <span>Barbearias</span>
            <span>Salões de beleza</span>
            <span>Estética</span>
            <span>Manicure</span>
            <span>Clínicas pequenas</span>
            <span>Personal trainer</span>
            <span>Studio de sobrancelha</span>
            <span>Profissionais autônomos</span>
          </div>
        </section>

        <section className="zunary-home-benefits">
          <div>
            <Smartphone size={24} />
            <strong>Menos mensagens repetidas</strong>
            <p>O cliente vê serviços, datas e horários sem precisar perguntar tudo no WhatsApp.</p>
          </div>

          <div>
            <CheckCircle2 size={24} />
            <strong>Mais organização</strong>
            <p>Todos os agendamentos ficam centralizados no painel da empresa.</p>
          </div>

          <div>
            <CalendarDays size={24} />
            <strong>Página própria</strong>
            <p>Cada negócio ganha um link público simples para receber agendamentos.</p>
          </div>
        </section>

        <section className="zunary-home-final-cta">
          <span>Beta gratuito</span>
          <h2>Teste a Zunary no seu negócio.</h2>
          <p>
            Estamos liberando poucas vagas para negócios locais testarem a
            primeira versão gratuitamente.
          </p>

          <Link to="/register" className="zunary-home-button">
            Criar minha conta
          </Link>
        </section>
      </main>
    </div>
  );
}