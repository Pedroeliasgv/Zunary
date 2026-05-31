import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Building2,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import {
  getAdminOverview,
  isCurrentUserAdmin,
  type AdminOverview,
} from "../lib/admin";

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    PAYMENT_CREATED: "Cobrança criada",
    PAYMENT_RECEIVED: "Pagamento recebido",
    PAYMENT_CONFIRMED: "Pagamento confirmado",
    PAYMENT_OVERDUE: "Pagamento vencido",
    PAYMENT_DELETED: "Cobrança removida",
    PAYMENT_REFUNDED: "Pagamento estornado",
    SUBSCRIPTION_CANCELED_MANUALLY: "Assinatura cancelada manualmente",
    SIMULATED_PAYMENT_RECEIVED: "Pagamento simulado",
  };

  return labels[eventType] || eventType;
}

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Ativa",
    inactive: "Pendente",
    canceled: "Cancelada",
    past_due: "Vencida",
    paid: "Pago",
    pending: "Aguardando pagamento",
    overdue: "Vencido",
    refunded: "Estornado",
    failed: "Falhou",
  };

  return status ? labels[status] || status : "-";
}

function getStatusClass(status?: string | null) {
  if (status === "active" || status === "paid") return "paid";
  if (status === "inactive" || status === "pending") return "pending";
  if (status === "past_due" || status === "overdue" || status === "failed") {
    return "failed";
  }
  if (status === "canceled") return "canceled";
  if (status === "refunded") return "refunded";

  return "default";
}

export function Admin() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [companySearch, setCompanySearch] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] =
    useState("all");

  const billingEnvironment = import.meta.env.VITE_BILLING_ENV || "sandbox";
  const isSandbox = billingEnvironment === "sandbox";

  async function loadAdminPage() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar painel admin."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminPage();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!overview) return [];

    return overview.recent_companies.filter((company) => {
      const search = companySearch.trim().toLowerCase();

      if (!search) return true;

      return (
        company.name.toLowerCase().includes(search) ||
        company.slug.toLowerCase().includes(search) ||
        company.owner_name?.toLowerCase().includes(search) ||
        company.owner_email?.toLowerCase().includes(search)
      );
    });
  }, [overview, companySearch]);

  const filteredSubscriptions = useMemo(() => {
    if (!overview) return [];

    return overview.recent_subscriptions.filter((subscription) => {
      if (subscriptionStatusFilter === "all") return true;

      return subscription.status === subscriptionStatusFilter;
    });
  }, [overview, subscriptionStatusFilter]);

  if (loading) {
    return <p className="zunary-muted-text">Carregando painel admin...</p>;
  }

  if (!admin) {
    return (
      <div className="zunary-blocked-page">
        <div className="zunary-blocked-icon">
          <Shield size={24} />
        </div>

        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva para usuários admin/master da Zunary.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadAdminPage}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="zunary-empty-card">
        Nenhum dado administrativo encontrado.
      </div>
    );
  }

  const latestEvent = overview.recent_events[0];

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Painel master</h1>
          <p>
            Controle empresas, usuários, assinaturas e eventos de cobrança da
            Zunary.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadAdminPage}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <section className="zunary-admin-master-hero">
        <div>
          <span>Central de controle</span>
          <h2>Visão geral da operação</h2>
          <p>
            Acompanhe o estado do sistema, veja eventos recentes e acesse
            rapidamente as áreas administrativas.
          </p>
        </div>

        <div
          className={
            isSandbox
              ? "zunary-admin-env-card sandbox"
              : "zunary-admin-env-card production"
          }
        >
          <strong>{isSandbox ? "Sandbox" : "Produção"}</strong>
          <span>
            {isSandbox
              ? "Pagamentos em modo de teste."
              : "Pagamentos reais ativados."}
          </span>
        </div>
      </section>

      <div className="zunary-admin-quick-actions">
        <Link to="/admin/companies">
          <Building2 size={18} />
          <div>
            <strong>Empresas</strong>
            <span>Gerenciar empresas</span>
          </div>
        </Link>

        <Link to="/admin/subscriptions">
          <CreditCard size={18} />
          <div>
            <strong>Assinaturas</strong>
            <span>Planos e cobranças</span>
          </div>
        </Link>

        <Link to="/admin/events">
          <Activity size={18} />
          <div>
            <strong>Eventos</strong>
            <span>Webhooks e cobranças</span>
          </div>
        </Link>

        <Link to="/admin/users">
          <Users size={18} />
          <div>
            <strong>Usuários</strong>
            <span>Permissões e roles</span>
          </div>
        </Link>
      </div>

      <div className="zunary-admin-grid">
        <div className="zunary-admin-stat-card">
          <div>
            <Users size={20} />
          </div>
          <span>Usuários</span>
          <h3>{overview.users_count}</h3>
        </div>

        <div className="zunary-admin-stat-card">
          <div>
            <Building2 size={20} />
          </div>
          <span>Empresas</span>
          <h3>{overview.companies_count}</h3>
        </div>

        <div className="zunary-admin-stat-card">
          <div>
            <CreditCard size={20} />
          </div>
          <span>Assinaturas</span>
          <h3>{overview.subscriptions_count}</h3>
        </div>

        <div className="zunary-admin-stat-card">
          <div>
            <Shield size={20} />
          </div>
          <span>Ativas</span>
          <h3>{overview.active_subscriptions_count}</h3>
        </div>

        <div className="zunary-admin-stat-card">
          <div>
            <Clock size={20} />
          </div>
          <span>Pendentes</span>
          <h3>{overview.pending_subscriptions_count}</h3>
        </div>

        <div className="zunary-admin-stat-card">
          <div>
            <XCircle size={20} />
          </div>
          <span>Canceladas</span>
          <h3>{overview.canceled_subscriptions_count}</h3>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Saúde do sistema</h2>
          <p>Resumo rápido do ambiente de cobrança e eventos recentes.</p>
        </div>

        <div className="zunary-system-health-grid">
          <div>
            <span>Ambiente</span>
            <strong>{isSandbox ? "Sandbox" : "Produção"}</strong>
            <p>
              {isSandbox
                ? "Cobranças em modo de teste."
                : "Cobranças reais ativadas."}
            </p>
          </div>

          <div>
            <span>Último evento</span>
            <strong>
              {latestEvent ? getEventLabel(latestEvent.event_type) : "Nenhum"}
            </strong>
            <p>
              {latestEvent
                ? formatDateTime(latestEvent.created_at)
                : "Ainda sem eventos do Asaas."}
            </p>
          </div>

          <div>
            <span>Assinaturas ativas</span>
            <strong>{overview.active_subscriptions_count}</strong>
            <p>Empresas com plano ativo e pago.</p>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>{overview.pending_subscriptions_count}</strong>
            <p>Assinaturas aguardando pagamento.</p>
          </div>
        </div>
      </div>

      <div className="zunary-admin-dashboard-grid">
        <section className="zunary-card">
          <div className="zunary-card-header">
            <h2>Empresas recentes</h2>
            <p>Últimas empresas criadas na Zunary.</p>
          </div>

          <div className="zunary-admin-toolbar">
            <input
              className="zunary-input"
              value={companySearch}
              onChange={(event) => setCompanySearch(event.target.value)}
              placeholder="Buscar por empresa, dono, e-mail ou slug..."
            />

            <Link
              to="/admin/companies"
              className="zunary-button zunary-button-secondary"
            >
              Ver todas
            </Link>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="zunary-empty-card">Nenhuma empresa encontrada.</div>
          ) : (
            <div className="zunary-admin-list">
              {filteredCompanies.slice(0, 6).map((company) => (
                <Link
                  key={company.id}
                  to={`/admin/companies/${company.id}`}
                  className="zunary-admin-list-item zunary-admin-clickable-item"
                >
                  <div>
                    <strong>{company.name}</strong>

                    <span>
                      Dono: {company.owner_name || "Sem nome"} •{" "}
                      {company.owner_email || "Sem e-mail"}
                    </span>

                    <span>
                      Slug: /booking/{company.slug} •{" "}
                      {company.public_booking_enabled
                        ? "Página pública ativa"
                        : "Página pública desativada"}
                    </span>
                  </div>

                  <time>{formatDateTime(company.created_at)}</time>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="zunary-card">
          <div className="zunary-card-header">
            <h2>Assinaturas recentes</h2>
            <p>Últimas assinaturas criadas na Zunary.</p>
          </div>

          <div className="zunary-admin-toolbar">
            <select
              className="zunary-select"
              value={subscriptionStatusFilter}
              onChange={(event) =>
                setSubscriptionStatusFilter(event.target.value)
              }
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativas</option>
              <option value="inactive">Pendentes</option>
              <option value="canceled">Canceladas</option>
              <option value="past_due">Vencidas</option>
            </select>

            <Link
              to="/admin/subscriptions"
              className="zunary-button zunary-button-secondary"
            >
              Ver todas
            </Link>
          </div>

          {filteredSubscriptions.length === 0 ? (
            <div className="zunary-empty-card">
              Nenhuma assinatura encontrada.
            </div>
          ) : (
            <div className="zunary-admin-list">
              {filteredSubscriptions.slice(0, 6).map((subscription) => (
                <div key={subscription.id} className="zunary-admin-list-item">
                  <div>
                    <strong>
                      {subscription.company_name || "Empresa sem nome"}
                    </strong>

                    <span>
                      Plano: {subscription.plan_name || "Plano não encontrado"}
                    </span>

                    <div className="zunary-subscription-badges">
                      <strong
                        className={`zunary-status-pill ${getStatusClass(
                          subscription.status
                        )}`}
                      >
                        {getStatusLabel(subscription.status)}
                      </strong>

                      <strong
                        className={`zunary-status-pill ${getStatusClass(
                          subscription.billing_status
                        )}`}
                      >
                        {getStatusLabel(subscription.billing_status)}
                      </strong>
                    </div>

                    <span>
                      Vencimento: {formatDate(subscription.next_due_date)}
                    </span>

                    {subscription.checkout_url && (
                      <a
                        href={subscription.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="zunary-admin-inline-link"
                      >
                        <ExternalLink size={13} />
                        Abrir pagamento
                      </a>
                    )}
                  </div>

                  <time>{formatDateTime(subscription.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Eventos recentes de cobrança</h2>
          <p>Últimos eventos recebidos do Asaas.</p>
        </div>

        {overview.recent_events.length === 0 ? (
          <div className="zunary-empty-card">
            Nenhum evento de cobrança encontrado.
          </div>
        ) : (
          <div className="zunary-admin-list">
            {overview.recent_events.slice(0, 8).map((event) => (
              <div key={event.id} className="zunary-admin-list-item">
                <div>
                  <strong>{getEventLabel(event.event_type)}</strong>

                  <span>
                    {event.company_name || "Empresa não vinculada"} •{" "}
                    {event.event_type}
                  </span>

                  <div className="zunary-subscription-badges">
                    <strong
                      className={`zunary-status-pill ${getStatusClass(
                        event.subscription_status
                      )}`}
                    >
                      {getStatusLabel(event.subscription_status)}
                    </strong>

                    <strong
                      className={`zunary-status-pill ${getStatusClass(
                        event.billing_status
                      )}`}
                    >
                      {getStatusLabel(event.billing_status)}
                    </strong>
                  </div>
                </div>

                <time>{formatDateTime(event.created_at)}</time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}