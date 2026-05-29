import { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  CreditCard,
  ExternalLink,
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

      if (!adminStatus) {
        return;
      }

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
    return <div className="zunary-error">{errorMessage}</div>;
  }

  if (!overview) {
    return (
      <div className="zunary-empty-card">
        Nenhum dado administrativo encontrado.
      </div>
    );
  }

  const filteredCompanies = overview.recent_companies.filter((company) => {
    const search = companySearch.trim().toLowerCase();

    if (!search) return true;

    return (
      company.name.toLowerCase().includes(search) ||
      company.slug.toLowerCase().includes(search) ||
      company.owner_name?.toLowerCase().includes(search) ||
      company.owner_email?.toLowerCase().includes(search)
    );
  });

  const filteredSubscriptions = overview.recent_subscriptions.filter(
    (subscription) => {
      if (subscriptionStatusFilter === "all") {
        return true;
      }

      return subscription.status === subscriptionStatusFilter;
    }
  );

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Painel master</h1>
          <p>Acompanhe usuários, empresas, assinaturas e eventos de cobrança.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadAdminPage}
        >
          Atualizar
        </button>
      </div>

      <div
        className={
          isSandbox
            ? "zunary-admin-env-card sandbox"
            : "zunary-admin-env-card production"
        }
      >
        <strong>Ambiente de cobrança: {isSandbox ? "Sandbox" : "Produção"}</strong>

        <span>
          {isSandbox
            ? "Os pagamentos estão em modo de teste. Simulações estão liberadas apenas para uso interno."
            : "Os pagamentos estão em modo real. Ações de cobrança podem impactar clientes de verdade."}
        </span>
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
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="zunary-empty-card">Nenhuma empresa encontrada.</div>
        ) : (
          <div className="zunary-admin-list">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="zunary-admin-list-item">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="zunary-card">
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
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="zunary-empty-card">
            Nenhuma assinatura encontrada.
          </div>
        ) : (
          <div className="zunary-admin-list">
            {filteredSubscriptions.map((subscription) => (
              <div key={subscription.id} className="zunary-admin-list-item">
                <div>
                  <strong>
                    {subscription.company_name || "Empresa sem nome"}
                  </strong>

                  <span>
                    Plano: {subscription.plan_name || "Plano não encontrado"} •{" "}
                    Status: {getStatusLabel(subscription.status)} /{" "}
                    {getStatusLabel(subscription.billing_status)}
                  </span>

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
            {overview.recent_events.map((event) => (
              <div key={event.id} className="zunary-admin-list-item">
                <div>
                  <strong>{getEventLabel(event.event_type)}</strong>

                  <span>
                    {event.company_name || "Empresa não vinculada"} •{" "}
                    {event.event_type}
                  </span>

                  <span>
                    Status: {getStatusLabel(event.subscription_status)} /{" "}
                    {getStatusLabel(event.billing_status)}
                  </span>
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