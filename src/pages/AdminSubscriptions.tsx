import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import {
  getAdminSubscriptions,
  isCurrentUserAdmin,
  type AdminSubscription,
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

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSubscriptions() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar assinaturas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const summary = useMemo(() => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter((item) => item.status === "active").length,
      pending: subscriptions.filter((item) => item.status === "inactive").length,
      canceled: subscriptions.filter((item) => item.status === "canceled")
        .length,
      pastDue: subscriptions.filter((item) => item.status === "past_due").length,
    };
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        subscription.company_name?.toLowerCase().includes(value) ||
        subscription.plan_name?.toLowerCase().includes(value) ||
        subscription.status.toLowerCase().includes(value) ||
        subscription.billing_status?.toLowerCase().includes(value) ||
        subscription.asaas_subscription_id?.toLowerCase().includes(value) ||
        subscription.asaas_payment_id?.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "all" || subscription.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  if (loading) {
    return <p className="zunary-muted-text">Carregando assinaturas...</p>;
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
          onClick={loadSubscriptions}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Assinaturas</h1>
          <p>Acompanhe planos, cobranças e status das empresas da Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadSubscriptions}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="zunary-admin-subscriptions-overview">
        <button
          className={statusFilter === "all" ? "active" : ""}
          type="button"
          onClick={() => setStatusFilter("all")}
        >
          <CreditCard size={20} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </button>

        <button
          className={statusFilter === "active" ? "active" : ""}
          type="button"
          onClick={() => setStatusFilter("active")}
        >
          <CheckCircle2 size={20} />
          <span>Ativas</span>
          <strong>{summary.active}</strong>
        </button>

        <button
          className={statusFilter === "inactive" ? "active" : ""}
          type="button"
          onClick={() => setStatusFilter("inactive")}
        >
          <AlertTriangle size={20} />
          <span>Pendentes</span>
          <strong>{summary.pending}</strong>
        </button>

        <button
          className={statusFilter === "past_due" ? "active" : ""}
          type="button"
          onClick={() => setStatusFilter("past_due")}
        >
          <AlertTriangle size={20} />
          <span>Vencidas</span>
          <strong>{summary.pastDue}</strong>
        </button>

        <button
          className={statusFilter === "canceled" ? "active" : ""}
          type="button"
          onClick={() => setStatusFilter("canceled")}
        >
          <XCircle size={20} />
          <span>Canceladas</span>
          <strong>{summary.canceled}</strong>
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Lista de assinaturas</h2>
          <p>
            Busque por empresa, plano, status, cobrança ou identificadores do
            Asaas.
          </p>
        </div>

        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa, plano, status ou ID Asaas..."
            />
          </div>

          <select
            className="zunary-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
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
          <div className="zunary-admin-subscriptions-list">
            {filteredSubscriptions.map((subscription) => (
              <article
                key={subscription.id}
                className="zunary-admin-subscription-card"
              >
                <div className="zunary-admin-subscription-card-main">
                  <div className="zunary-admin-subscription-card-top">
                    <div>
                      <span className="zunary-admin-subscription-eyebrow">
                        {subscription.plan_name || "Plano não encontrado"}
                      </span>

                      <h3>
                        {subscription.company_name || "Empresa sem nome"}
                      </h3>
                    </div>

                    <time>{formatDateTime(subscription.created_at)}</time>
                  </div>

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

                  <div className="zunary-admin-subscription-info-grid">
                    <div>
                      <span>Vencimento</span>
                      <strong>{formatDate(subscription.next_due_date)}</strong>
                    </div>

                    <div>
                      <span>Asaas subscription</span>
                      <strong>
                        {subscription.asaas_subscription_id || "-"}
                      </strong>
                    </div>

                    <div>
                      <span>Asaas payment</span>
                      <strong>{subscription.asaas_payment_id || "-"}</strong>
                    </div>
                  </div>
                </div>

                <div className="zunary-admin-subscription-card-actions">
                  <Link
                    to={`/admin/companies/${subscription.company_id}`}
                    className="zunary-button"
                  >
                    Ver empresa
                  </Link>

                  {subscription.checkout_url && (
                    <a
                      href={subscription.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="zunary-button zunary-button-secondary"
                    >
                      <ExternalLink size={15} />
                      Abrir pagamento
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}