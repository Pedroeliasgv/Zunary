import { useEffect, useMemo, useState } from "react";
import { Search, Shield } from "lucide-react";
import {
  getAdminBillingEvents,
  isCurrentUserAdmin,
  type AdminBillingEvent,
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
    SIMULATED_PAYMENT_RECEIVED: "Pagamento simulado",
  };

  return labels[eventType] || eventType;
}

export function AdminEvents() {
  const [events, setEvents] = useState<AdminBillingEvent[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminBillingEvents();
      setEvents(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar eventos de cobrança."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const eventTypes = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.event_type))).sort();
  }, [events]);

  const filteredEvents = events.filter((event) => {
    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      event.company_name?.toLowerCase().includes(value) ||
      event.event_type.toLowerCase().includes(value) ||
      event.asaas_payment_id?.toLowerCase().includes(value) ||
      event.asaas_subscription_id?.toLowerCase().includes(value) ||
      event.asaas_customer_id?.toLowerCase().includes(value);

    const matchesEvent =
      eventFilter === "all" || event.event_type === eventFilter;

    return matchesSearch && matchesEvent;
  });

  if (loading) {
    return <p className="zunary-muted-text">Carregando eventos...</p>;
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
          <h1>Eventos de cobrança</h1>
          <p>Acompanhe os eventos recebidos do Asaas.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadEvents}
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
              placeholder="Buscar por empresa, evento ou ID Asaas..."
            />
          </div>

          <select
            className="zunary-select"
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
          >
            <option value="all">Todos os eventos</option>

            {eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>
                {getEventLabel(eventType)}
              </option>
            ))}
          </select>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="zunary-empty-card">
            Nenhum evento de cobrança encontrado.
          </div>
        ) : (
          <div className="zunary-admin-list">
            {filteredEvents.map((event) => (
              <div key={event.id} className="zunary-admin-list-item">
                <div>
                  <strong>{getEventLabel(event.event_type)}</strong>

                  <span>
                    Empresa: {event.company_name || "Não vinculada"} •{" "}
                    Provider: {event.provider}
                  </span>

                  <span>Evento: {event.event_type}</span>

                  {event.asaas_subscription_id && (
                    <span>
                      Asaas subscription: {event.asaas_subscription_id}
                    </span>
                  )}

                  {event.asaas_payment_id && (
                    <span>Asaas payment: {event.asaas_payment_id}</span>
                  )}

                  {event.asaas_customer_id && (
                    <span>Asaas customer: {event.asaas_customer_id}</span>
                  )}
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