import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Scissors,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CompanyForm } from "../components/company/CompanyForm";
import { getAppointmentsCountByCompany } from "../lib/appointments";
import { isCurrentUserAdmin } from "../lib/admin";
import { getAvailabilityByCompany } from "../lib/availability";
import { getCurrentUserCompany } from "../lib/company";
import {
  getCompanyActiveSubscription,
  type CompanySubscription,
} from "../lib/plans";
import { getServicesByCompany } from "../lib/services";
import type { Company } from "../types";

type DashboardStats = {
  servicesCount: number;
  activeServicesCount: number;
  availabilityCount: number;
  activeAvailabilityCount: number;
  appointmentsCount: number;
};

type ChecklistItem = {
  title: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
};

export function Dashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    servicesCount: 0,
    activeServicesCount: 0,
    availabilityCount: 0,
    activeAvailabilityCount: 0,
    appointmentsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [companyData, adminStatus] = await Promise.all([
        getCurrentUserCompany(),
        isCurrentUserAdmin(),
      ]);

      setCompany(companyData);
      setIsAdmin(adminStatus);

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
          activeServicesCount: servicesData.filter(
            (service) => service.is_active
          ).length,
          availabilityCount: availabilityData.length,
          activeAvailabilityCount: availabilityData.filter(
            (rule) => rule.is_active
          ).length,
          appointmentsCount,
        });

        setSubscription(subscriptionData);
      } else {
        setSubscription(null);
        setStats({
          servicesCount: 0,
          activeServicesCount: 0,
          availabilityCount: 0,
          activeAvailabilityCount: 0,
          appointmentsCount: 0,
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar dashboard."
      );
    } finally {
      setLoading(false);
    }
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

  const hasPlanAccess = isAdmin || Boolean(subscription);

  const checklist: ChecklistItem[] = useMemo(() => {
    if (!company) return [];

    return [
      {
        title: "Empresa criada",
        description: "Sua empresa já está vinculada à sua conta.",
        done: Boolean(company),
        href: "/settings",
        action: "Editar empresa",
      },
      {
        title: "Plano ativo",
        description: isAdmin
          ? "Conta admin liberada para testes internos."
          : subscription?.plans
          ? `Plano ${subscription.plans.name} ativo.`
          : "Escolha um plano para liberar os recursos.",
        done: hasPlanAccess,
        href: "/plans",
        action: subscription || isAdmin ? "Ver plano" : "Escolher plano",
      },
      {
        title: "Serviços cadastrados",
        description:
          stats.activeServicesCount > 0
            ? `${stats.activeServicesCount} serviço(s) ativo(s).`
            : "Cadastre pelo menos um serviço ativo.",
        done: stats.activeServicesCount > 0,
        href: "/services",
        action: stats.activeServicesCount > 0 ? "Ver serviços" : "Criar serviço",
      },
      {
        title: "Disponibilidade definida",
        description:
          stats.activeAvailabilityCount > 0
            ? `${stats.activeAvailabilityCount} regra(s) ativa(s).`
            : "Defina pelo menos um horário de atendimento.",
        done: stats.activeAvailabilityCount > 0,
        href: "/availability",
        action:
          stats.activeAvailabilityCount > 0
            ? "Ver horários"
            : "Definir horários",
      },
      {
        title: "Página pública pronta",
        description:
          company.public_booking_enabled && hasPlanAccess
            ? "Seu link público está ativo para clientes."
            : "Ative sua página pública e mantenha um plano ativo.",
        done: company.public_booking_enabled && hasPlanAccess,
        href: "/settings",
        action: "Ajustar página",
      },
      {
        title: "Primeiro agendamento recebido",
        description:
          stats.appointmentsCount > 0
            ? `${stats.appointmentsCount} agendamento(s) recebido(s).`
            : "Compartilhe o link para receber o primeiro agendamento.",
        done: stats.appointmentsCount > 0,
        href: "/appointments",
        action: "Ver agendamentos",
      },
    ];
  }, [
    company,
    hasPlanAccess,
    isAdmin,
    subscription,
    stats.activeServicesCount,
    stats.activeAvailabilityCount,
    stats.appointmentsCount,
  ]);

  const completedSteps = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length || 1;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const nextStep = checklist.find((item) => !item.done);

  if (loading) {
    return <p className="zunary-muted-text">Carregando dashboard...</p>;
  }

  if (errorMessage) {
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadDashboard}
          type="button"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="zunary-page">
        <div className="zunary-page-header">
          <div>
            <span>Primeiro passo</span>
            <h1>Configure seu negócio</h1>
            <p>
              Em poucos minutos você cadastra sua empresa, organiza seus
              serviços e gera um link público para receber agendamentos.
            </p>
          </div>
        </div>

        <div className="zunary-onboarding-hero">
          <div>
            <span>Configuração inicial</span>
            <h2>Seu sistema de agendamento começa aqui</h2>
            <p>
              Cadastre sua empresa, defina os serviços, escolha os horários de
              atendimento e compartilhe sua página pública com os clientes.
            </p>
          </div>

          <div className="zunary-onboarding-mini-steps">
            <div>
              <Check size={15} />
              Empresa
            </div>

            <div>
              <Scissors size={15} />
              Serviços
            </div>

            <div>
              <Clock size={15} />
              Horários
            </div>

            <div>
              <ExternalLink size={15} />
              Link público
            </div>
          </div>
        </div>

        <CompanyForm onCompanyCreated={loadDashboard} />
      </div>
    );
  }

  const publicBookingPath = `/booking/${company.slug}`;
  const publicBookingUrl = `${window.location.origin}${publicBookingPath}`;

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Dashboard</span>
          <h1>{company.name}</h1>
          <p>
            Organize serviços, horários e solicitações recebidas em um painel
            simples.
          </p>
        </div>

        <div className="zunary-dashboard-header-actions">
          <button
            className="zunary-button zunary-button-secondary"
            onClick={loadDashboard}
            type="button"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>

          <a
            href={publicBookingPath}
            target="_blank"
            rel="noreferrer"
            className="zunary-button"
          >
            <ExternalLink size={16} />
            Página pública
          </a>
        </div>
      </div>

      {isAdmin && (
        <div className="zunary-sandbox-alert">
          <strong>Modo admin ativo</strong>
          <span>
            Esta conta está liberada para testes internos sem exigir assinatura
            paga.
          </span>
        </div>
      )}

      <div className="zunary-onboarding-card">
        <div className="zunary-onboarding-card-main">
          <span>Primeiros passos</span>

          <h2>
            {nextStep
              ? `Próximo passo: ${nextStep.title}`
              : "Sua agenda está pronta para receber clientes"}
          </h2>

          <p>
            {nextStep
              ? nextStep.description
              : "Compartilhe seu link público e acompanhe as solicitações recebidas pelo painel."}
          </p>

          <div className="zunary-onboarding-actions">
            {nextStep ? (
              <Link to={nextStep.href} className="zunary-button">
                {nextStep.action}
              </Link>
            ) : (
              <button
                className="zunary-button"
                onClick={handleCopyPublicLink}
                type="button"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Link copiado" : "Copiar link"}
              </button>
            )}

            <Link
              to="/appointments"
              className="zunary-button zunary-button-secondary"
            >
              Ver agendamentos
            </Link>
          </div>
        </div>

        <div className="zunary-onboarding-progress">
          <strong>{progressPercent}%</strong>

          <span>
            {completedSteps} de {checklist.length} etapas concluídas
          </span>

          <div className="zunary-progress-bar">
            <div style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
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
            <button onClick={handleCopyPublicLink} type="button">
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

          <h2>{isAdmin ? "Admin" : subscription?.plans?.name || "Sem plano"}</h2>

          <p>
            {isAdmin
              ? "Conta master liberada para testes internos sem cobrança."
              : subscription?.plans
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
          <h2>Checklist de configuração</h2>
          <p>
            Complete as etapas abaixo para deixar sua agenda pronta para os
            clientes.
          </p>
        </div>

        <div className="zunary-checklist">
          {checklist.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="zunary-checklist-item"
            >
              <div className={item.done ? "done" : ""}>
                {item.done ? <Check size={16} /> : null}
              </div>

              <section>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </section>
            </Link>
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

          <button onClick={handleCopyPublicLink} type="button">
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

        <div className="zunary-stat-card">
          <div>
            <Settings size={20} />
          </div>

          <span>Página pública</span>
          <h3>{company.public_booking_enabled ? "Ativa" : "Off"}</h3>
          <p>{hasPlanAccess ? "Plano liberado" : "Plano pendente"}</p>
        </div>
      </div>
    </div>
  );
}