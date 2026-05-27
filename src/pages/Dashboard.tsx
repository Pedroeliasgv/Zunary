import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Scissors,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CompanyForm } from "../components/company/CompanyForm";
import { getAppointmentsCountByCompany } from "../lib/appointments";
import { getAvailabilityByCompany } from "../lib/availability";
import { getCurrentUserCompany } from "../lib/company";
import { getCompanyActiveSubscription, type CompanySubscription } from "../lib/plans";
import { getServicesByCompany } from "../lib/services";
import type { Company } from "../types";

type DashboardStats = {
  servicesCount: number;
  activeServicesCount: number;
  availabilityCount: number;
  activeAvailabilityCount: number;
  appointmentsCount: number;
};

export function Dashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    servicesCount: 0,
    activeServicesCount: 0,
    availabilityCount: 0,
    activeAvailabilityCount: 0,
    appointmentsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function loadDashboard() {
    setLoading(true);

    const companyData = await getCurrentUserCompany();
    setCompany(companyData);

    if (companyData) {
      const [
        servicesData,
        availabilityData,
        appointmentsCount,
        subscriptionData,
      ] = await Promise.all([
        getServicesByCompany(companyData.id),
        getAvailabilityByCompany(companyData.id),
        getAppointmentsCountByCompany(companyData.id),
        getCompanyActiveSubscription(companyData.id),
      ]);

      setStats({
        servicesCount: servicesData.length,
        activeServicesCount: servicesData.filter((service) => service.is_active)
          .length,
        availabilityCount: availabilityData.length,
        activeAvailabilityCount: availabilityData.filter((rule) => rule.is_active)
          .length,
        appointmentsCount,
      });

      setSubscription(subscriptionData);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCopyPublicLink() {
    if (!company) return;

    const publicLink = `${window.location.origin}/booking/${company.slug}`;

    await navigator.clipboard.writeText(publicLink);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  if (loading) {
    return <p className="zunary-muted-text">Carregando...</p>;
  }

  if (!company) {
    return (
      <div className="zunary-page">
        <div className="zunary-page-header">
          <div>
            <span>Primeiro passo</span>
            <h1>Crie sua empresa</h1>
            <p>
              Para começar, cadastre as informações básicas do seu negócio.
            </p>
          </div>
        </div>

        <CompanyForm onCompanyCreated={loadDashboard} />
      </div>
    );
  }

  const publicBookingPath = `/booking/${company.slug}`;
  const publicBookingUrl = `${window.location.origin}${publicBookingPath}`;

  const checklist = [
    {
      title: "Empresa criada",
      description: "Sua empresa já está vinculada à sua conta.",
      done: Boolean(company),
      href: "/settings",
    },
    {
      title: "Plano ativo",
      description: subscription?.plans
        ? `Plano ${subscription.plans.name} ativo.`
        : "Escolha um plano para liberar os recursos.",
      done: Boolean(subscription),
      href: "/plans",
    },
    {
      title: "Serviços cadastrados",
      description:
        stats.activeServicesCount > 0
          ? `${stats.activeServicesCount} serviço(s) ativo(s).`
          : "Cadastre pelo menos um serviço ativo.",
      done: stats.activeServicesCount > 0,
      href: "/services",
    },
    {
      title: "Disponibilidade definida",
      description:
        stats.activeAvailabilityCount > 0
          ? `${stats.activeAvailabilityCount} regra(s) ativa(s).`
          : "Defina pelo menos um horário de atendimento.",
      done: stats.activeAvailabilityCount > 0,
      href: "/availability",
    },
    {
      title: "Página pública pronta",
      description:
        company.public_booking_enabled && subscription
          ? "Seu link público está ativo para clientes."
          : "Ative sua página pública e mantenha um plano ativo.",
      done: company.public_booking_enabled && Boolean(subscription),
      href: "/settings",
    },
    {
      title: "Primeiro agendamento recebido",
      description:
        stats.appointmentsCount > 0
          ? `${stats.appointmentsCount} agendamento(s) recebido(s).`
          : "Compartilhe o link para receber o primeiro agendamento.",
      done: stats.appointmentsCount > 0,
      href: "/appointments",
    },
  ];

  const completedSteps = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length;

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Dashboard</span>
          <h1>{company.name}</h1>
          <p>Gerencie seus serviços, horários e agendamentos.</p>
        </div>

        <a
          href={publicBookingPath}
          target="_blank"
          rel="noreferrer"
          className="zunary-public-link"
        >
          <ExternalLink size={16} />
          Página pública
        </a>
      </div>

      <div className="zunary-dashboard-top-grid">
        <div className="zunary-hero-card">
          <div>
            <span>Link público de agendamento</span>
            <h2>{publicBookingPath}</h2>
            <p>
              Compartilhe esse link com seus clientes para receber solicitações
              de agendamento.
            </p>
          </div>

          <div className="zunary-hero-actions">
            <button onClick={handleCopyPublicLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar link"}
            </button>

            <a href={publicBookingPath} target="_blank" rel="noreferrer">
              Abrir página
            </a>
          </div>
        </div>

        <div className="zunary-plan-status-card">
          <div className="zunary-plan-status-icon">
            <CreditCard size={22} />
          </div>

          <span>Plano atual</span>

          <h2>{subscription?.plans?.name || "Sem plano"}</h2>

          <p>
            {subscription?.plans
              ? `Sua empresa está ativa no plano ${subscription.plans.name}.`
              : "Escolha um plano para liberar o sistema e a página pública."}
          </p>

          <Link to="/plans" className="zunary-button">
            Gerenciar plano
          </Link>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Checklist do MVP</h2>
          <p>
            Progresso da configuração: {completedSteps} de {totalSteps} etapas
            concluídas.
          </p>
        </div>

        <div className="zunary-progress-bar">
          <div
            style={{
              width: `${(completedSteps / totalSteps) * 100}%`,
            }}
          />
        </div>

        <div className="zunary-checklist">
          {checklist.map((item) => (
            <a key={item.title} href={item.href} className="zunary-checklist-item">
              <div className={item.done ? "done" : ""}>
                {item.done ? <Check size={16} /> : null}
              </div>

              <section>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </section>
            </a>
          ))}
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Seu link completo</h2>
          <p>
            Esse é o endereço que seus clientes vão acessar para fazer
            agendamentos.
          </p>
        </div>

        <div className="zunary-link-box">
          <span>{publicBookingUrl}</span>

          <button onClick={handleCopyPublicLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="zunary-grid">
        <div className="zunary-stat-card">
          <div>
            <Scissors size={20} />
          </div>
          <span>Serviços ativos</span>
          <h3>{stats.activeServicesCount}</h3>
          <p>Total cadastrado: {stats.servicesCount}</p>
        </div>

        <div className="zunary-stat-card">
          <div>
            <Clock size={20} />
          </div>
          <span>Disponibilidades ativas</span>
          <h3>{stats.activeAvailabilityCount}</h3>
          <p>Total cadastrado: {stats.availabilityCount}</p>
        </div>

        <div className="zunary-stat-card">
          <div>
            <CalendarDays size={20} />
          </div>
          <span>Agendamentos</span>
          <h3>{stats.appointmentsCount}</h3>
          <p>Total de solicitações recebidas.</p>
        </div>
      </div>
    </div>
  );
}