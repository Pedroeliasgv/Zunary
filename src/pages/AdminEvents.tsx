import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
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

function getEventClass(eventType: string) {
  if (
    eventType === "PAYMENT_RECEIVED" ||
    eventType === "PAYMENT_CONFIRMED" ||
    eventType === "SIMULATED_PAYMENT_RECEIVED"
  ) {
    return "success";
  }

  if (eventType === "PAYMENT_CREATED") {
    return "info";
  }

  if (eventType === "PAYMENT_OVERDUE") {
    return "warning";
  }

  if (
    eventType === "PAYMENT_DELETED" ||
    eventType === "PAYMENT_REFUNDED" ||
    eventType === "SUBSCRIPTION_CANCELED_MANUALLY"
  ) {
    return "danger";
  }

  return "default";
}

function getEventIcon(eventType: string) {
  if (
    eventType === "PAYMENT_RECEIVED" ||
    eventType === "PAYMENT_CONFIRMED" ||
    eventType === "SIMULATED_PAYMENT_RECEIVED"
  ) {
    return CheckCircle2;
  }

  if (eventType === "PAYMENT_OVERDUE") {
    return AlertTriangle;
  }

  if (
    eventType === "PAYMENT_DELETED" ||
    eventType === "PAYMENT_REFUNDED" ||
    eventType === "SUBSCRIPTION_CANCELED_MANUALLY"
  ) {
    return XCircle;
  }

  return CreditCard;
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

  const summary = useMemo(() => {
    return {
      total: events.length,
      success: events.filter(
        (event) =>
          event.event_type === "PAYMENT_RECEIVED" ||
          event.event_type === "PAYMENT_CONFIRMED" ||
          event.event_type === "SIMULATED_PAYMENT_RECEIVED"
      ).length,
      created: events.filter((event) => event.event_type === "PAYMENT_CREATED")
        .length,
      overdue: events.filter((event) => event.event_type === "PAYMENT_OVERDUE")
        .length,
      canceled: events.filter(
        (event) =>
          event.event_type === "PAYMENT_DELETED" ||
          event.event_type === "PAYMENT_REFUNDED" ||
          event.event_type === "SUBSCRIPTION_CANCELED_MANUALLY"
      ).length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        event.company_name?.toLowerCase().includes(value) ||
        event.event_type.toLowerCase().includes(value) ||
        event.provider.toLowerCase().includes(value) ||
        event.asaas_payment_id?.toLowerCase().includes(value) ||
        event.asaas_subscription_id?.toLowerCase().includes(value) ||
        event.asaas_customer_id?.toLowerCase().includes(value);

      const matchesEvent =
        eventFilter === "all" || event.event_type === eventFilter;

      return matchesSearch && matchesEvent;
    });
  }, [events, search, eventFilter]);

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
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadEvents}
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
          <h1>Eventos de cobrança</h1>
          <p>Acompanhe webhooks e eventos recebidos do Asaas.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadEvents}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="zunary-admin-events-overview">
        <button
          className={eventFilter === "all" ? "active" : ""}
          type="button"
          onClick={() => setEventFilter("all")}
        >
          <Activity size={20} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </button>

        <button
          type="button"
          onClick={() => setEventFilter("PAYMENT_RECEIVED")}
        >
          <CheckCircle2 size={20} />
          <span>Pagamentos recebidos</span>
          <strong>{summary.success}</strong>
        </button>

        <button type="button" onClick={() => setEventFilter("PAYMENT_CREATED")}>
          <CreditCard size={20} />
          <span>Cobranças criadas</span>
          <strong>{summary.created}</strong>
        </button>

        <button type="button" onClick={() => setEventFilter("PAYMENT_OVERDUE")}>
          <AlertTriangle size={20} />
          <span>Vencidos</span>
          <strong>{summary.overdue}</strong>
        </button>

        <button
          type="button"
          onClick={() => setEventFilter("SUBSCRIPTION_CANCELED_MANUALLY")}
        >
          <XCircle size={20} />
          <span>Cancelados</span>
          <strong>{summary.canceled}</strong>
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Lista de eventos</h2>
          <p>Busque por empresa, tipo de evento, provider ou IDs do Asaas.</p>
        </div>

        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa, evento, provider ou ID Asaas..."
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
          <div className="zunary-admin-events-list">
            {filteredEvents.map((event) => {
              const EventIcon = getEventIcon(event.event_type);

              return (
                <article key={event.id} className="zunary-admin-event-card">
                  <div
                    className={`zunary-admin-event-icon ${getEventClass(
                      event.event_type
                    )}`}
                  >
                    <EventIcon size={20} />
                  </div>

                  <div className="zunary-admin-event-main">
                    <div className="zunary-admin-event-top">
                      <div>
                        <span
                          className={`zunary-admin-event-badge ${getEventClass(
                            event.event_type
                          )}`}
                        >
                          {event.provider}
                        </span>

                        <h3>{getEventLabel(event.event_type)}</h3>
                      </div>

                      <time>{formatDateTime(event.created_at)}</time>
                    </div>

                    <div className="zunary-admin-event-info-grid">
                      <div>
                        <span>Empresa</span>
                        <strong>
                          {event.company_name || "Empresa não vinculada"}
                        </strong>
                      </div>

                      <div>
                        <span>Evento</span>
                        <strong>{event.event_type}</strong>
                      </div>

                      <div>
                        <span>Asaas subscription</span>
                        <strong>{event.asaas_subscription_id || "-"}</strong>
                      </div>

                      <div>
                        <span>Asaas payment</span>
                        <strong>{event.asaas_payment_id || "-"}</strong>
                      </div>

                      <div>
                        <span>Asaas customer</span>
                        <strong>{event.asaas_customer_id || "-"}</strong>
                      </div>
                    </div>

                    {event.company_id && (
                      <Link
                        to={`/admin/companies/${event.company_id}`}
                        className="zunary-admin-inline-link"
                      >
                        Ver empresa relacionada
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}