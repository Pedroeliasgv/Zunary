import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Search, Shield } from "lucide-react";
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

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      subscription.company_name?.toLowerCase().includes(value) ||
      subscription.plan_name?.toLowerCase().includes(value) ||
      subscription.status.toLowerCase().includes(value) ||
      subscription.billing_status?.toLowerCase().includes(value) ||
      subscription.asaas_subscription_id?.toLowerCase().includes(value);

    const matchesStatus =
      statusFilter === "all" || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
    return <div className="zunary-error">{errorMessage}</div>;
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Assinaturas</h1>
          <p>Acompanhe todas as assinaturas criadas na Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadSubscriptions}
        >
          Atualizar
        </button>
      </div>

      <div className="zunary-card">
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
                    Vencimento: {formatDate(subscription.next_due_date)} •
                    Criada em: {formatDateTime(subscription.created_at)}
                  </span>

                  {subscription.asaas_subscription_id && (
                    <span>
                      Asaas subscription: {subscription.asaas_subscription_id}
                    </span>
                  )}

                  {subscription.asaas_payment_id && (
                    <span>Asaas payment: {subscription.asaas_payment_id}</span>
                  )}

                  <Link
                    to={`/admin/companies/${subscription.company_id}`}
                    className="zunary-admin-inline-link"
                    >
                    Ver empresa
                    </Link>

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
    </div>
  );
}