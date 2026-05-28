import { useEffect, useState } from "react";
import { Shield, Users, Building2, CreditCard, Clock, XCircle } from "lucide-react";
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

function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    PAYMENT_CREATED: "Cobrança criada",
    PAYMENT_RECEIVED: "Pagamento recebido",
    PAYMENT_CONFIRMED: "Pagamento confirmado",
    PAYMENT_OVERDUE: "Pagamento vencido",
    PAYMENT_DELETED: "Cobrança removida",
    PAYMENT_REFUNDED: "Pagamento estornado",
    SUBSCRIPTION_CANCELED_MANUALLY: "Assinatura cancelada manualmente",
  };

  return labels[eventType] || eventType;
}

export function Admin() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
        error instanceof Error ? error.message : "Erro ao carregar painel admin."
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

        <p>
          Esta área é exclusiva para usuários admin/master da Zunary.
        </p>
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

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Painel master</h1>
          <p>
            Acompanhe usuários, empresas, assinaturas e eventos de cobrança.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadAdminPage}
        >
          Atualizar
        </button>
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
          <h2>Assinaturas recentes</h2>
          <p>Últimas assinaturas criadas na Zunary.</p>
        </div>

        {overview.recent_subscriptions.length === 0 ? (
          <div className="zunary-empty-card">
            Nenhuma assinatura encontrada.
          </div>
        ) : (
          <div className="zunary-admin-list">
            {overview.recent_subscriptions.map((subscription) => (
              <div key={subscription.id} className="zunary-admin-list-item">
                <div>
                  <strong>{subscription.company_name || "Empresa sem nome"}</strong>
                  <span>
                    {subscription.plan_name || "Plano não encontrado"} •{" "}
                    {subscription.status} / {subscription.billing_status || "-"}
                  </span>
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