import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Scissors,
  Shield,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  adminUpdateCompanyPublicBooking,
  getAdminCompanyDetails,
  isCurrentUserAdmin,
  type AdminCompanyDetails as AdminCompanyDetailsType,
} from "../lib/admin";
import {
  cancelAsaasSubscription,
  simulateAsaasPayment,
} from "../lib/billing";
import { formatCurrency } from "../lib/utils";

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
    confirmed: "Confirmado",
    completed: "Concluído",
    canceled_appointment: "Cancelado",
  };

  return status ? labels[status] || status : "-";
}

function getStatusClass(status?: string | null) {
  if (status === "active" || status === "paid" || status === "confirmed") {
    return "paid";
  }

  if (status === "inactive" || status === "pending") {
    return "pending";
  }

  if (
    status === "past_due" ||
    status === "overdue" ||
    status === "failed" ||
    status === "canceled"
  ) {
    return "failed";
  }

  if (status === "refunded" || status === "completed") {
    return "refunded";
  }

  return "default";
}

function canSimulatePayment(status?: string | null, billingStatus?: string | null) {
  if (status === "canceled") return false;
  if (status === "active" && billingStatus === "paid") return false;

  return true;
}

export function AdminCompanyDetails() {
  const { id } = useParams();

  const [details, setDetails] = useState<AdminCompanyDetailsType | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [updatingPublicBooking, setUpdatingPublicBooking] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadCompanyDetails() {
    if (!id) {
      setErrorMessage("Empresa não encontrada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminCompanyDetails(id);
      setDetails(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar detalhes da empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanyDetails();
  }, [id]);

  const servicesCount = details?.services.length || 0;
  const activeServicesCount = useMemo(() => {
    return details?.services.filter((service) => service.is_active).length || 0;
  }, [details]);

  const appointmentsCount = details?.appointments.length || 0;

  async function handleTogglePublicBooking() {
    if (!details?.company) return;

    const nextValue = !details.company.public_booking_enabled;

    const confirmed = window.confirm(
      nextValue
        ? "Tem certeza que deseja ativar a página pública desta empresa?"
        : "Tem certeza que deseja desativar a página pública desta empresa?"
    );

    if (!confirmed) return;

    try {
      setUpdatingPublicBooking(true);
      setErrorMessage("");
      setSuccessMessage("");

      await adminUpdateCompanyPublicBooking(details.company.id, nextValue);

      setSuccessMessage(
        nextValue
          ? "Página pública ativada com sucesso."
          : "Página pública desativada com sucesso."
      );

      await loadCompanyDetails();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar página pública."
      );
    } finally {
      setUpdatingPublicBooking(false);
    }
  }

  async function handleCancelSubscription() {
    if (!details?.company || !details.subscription) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar a assinatura desta empresa? Ela também será cancelada no Asaas e a empresa perderá o acesso aos recursos pagos."
    );

    if (!confirmed) return;

    try {
      setCancelingSubscription(true);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelAsaasSubscription({
        company_id: details.company.id,
        subscription_id: details.subscription.id,
      });

      setSuccessMessage("Assinatura cancelada com sucesso no Asaas e na Zunary.");

      await loadCompanyDetails();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cancelar assinatura."
      );
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function handleSimulatePayment() {
    if (!details?.company || !details.subscription) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja simular o pagamento desta assinatura? Essa ação deve ser usada apenas em ambiente sandbox."
    );

    if (!confirmed) return;

    try {
      setSimulatingPayment(true);
      setErrorMessage("");
      setSuccessMessage("");

      await simulateAsaasPayment({
        company_id: details.company.id,
        subscription_id: details.subscription.id,
      });

      setSuccessMessage(
        "Pagamento simulado com sucesso. A assinatura foi ativada."
      );

      await loadCompanyDetails();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao simular pagamento."
      );
    } finally {
      setSimulatingPayment(false);
    }
  }

  if (loading) {
    return <p className="zunary-muted-text">Carregando empresa...</p>;
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

  if (!details?.company) {
    return <div className="zunary-empty-card">Empresa não encontrada.</div>;
  }

  const { company, subscription, services, appointments } = details;

  const billingEnvironment = import.meta.env.VITE_BILLING_ENV || "sandbox";
  const isSandbox = billingEnvironment === "sandbox";

  const showSimulatePaymentButton =
    isSandbox &&
    subscription &&
    canSimulatePayment(subscription.status, subscription.billing_status);

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin / Empresa</span>
          <h1>{company.name}</h1>
          <p>Detalhes completos da empresa cadastrada na Zunary.</p>
        </div>

        <div className="zunary-admin-header-actions">
          <button
            className="zunary-button zunary-button-secondary"
            onClick={loadCompanyDetails}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>

          <Link
            to="/admin/companies"
            className="zunary-button zunary-button-secondary"
          >
            Voltar
          </Link>

          <a
            href={`/booking/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="zunary-button"
          >
            <ExternalLink size={16} />
            Página pública
          </a>
        </div>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      <section className="zunary-admin-company-hero">
        <div>
          <span
            className={
              company.public_booking_enabled
                ? "zunary-status-badge active"
                : "zunary-status-badge inactive"
            }
          >
            {company.public_booking_enabled
              ? "Página pública ativa"
              : "Página pública desativada"}
          </span>

          <h2>{company.name}</h2>

          <p>
            /booking/{company.slug} • {company.business_type || "Tipo não informado"}
          </p>
        </div>

        <button
          className={
            company.public_booking_enabled
              ? "zunary-button zunary-button-danger"
              : "zunary-button"
          }
          onClick={handleTogglePublicBooking}
          disabled={updatingPublicBooking}
        >
          {updatingPublicBooking
            ? "Atualizando..."
            : company.public_booking_enabled
            ? "Desativar página pública"
            : "Ativar página pública"}
        </button>
      </section>

      <div className="zunary-admin-companies-overview">
        <div>
          <Scissors size={20} />
          <span>Serviços ativos</span>
          <strong>
            {activeServicesCount}/{servicesCount}
          </strong>
        </div>

        <div>
          <CalendarDays size={20} />
          <span>Agendamentos recentes</span>
          <strong>{appointmentsCount}</strong>
        </div>

        <div>
          <CreditCard size={20} />
          <span>Assinatura</span>
          <strong>{subscription ? getStatusLabel(subscription.status) : "Sem plano"}</strong>
        </div>
      </div>

      <div className="zunary-admin-details-grid">
        <div className="zunary-card">
          <div className="zunary-card-header">
            <h2>Dados da empresa</h2>
            <p>Informações principais do negócio.</p>
          </div>

          <div className="zunary-admin-details-list">
            <div>
              <span>Nome</span>
              <strong>{company.name}</strong>
            </div>

            <div>
              <span>Slug</span>
              <strong>/booking/{company.slug}</strong>
            </div>

            <div>
              <span>Tipo de negócio</span>
              <strong>{company.business_type || "Não informado"}</strong>
            </div>

            <div>
              <span>Página pública</span>
              <strong>
                {company.public_booking_enabled ? "Ativa" : "Desativada"}
              </strong>
            </div>

            <div>
              <span>Criada em</span>
              <strong>{formatDateTime(company.created_at)}</strong>
            </div>

            <div>
              <span>Atualizada em</span>
              <strong>{formatDateTime(company.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="zunary-card">
          <div className="zunary-card-header">
            <h2>Dono da empresa</h2>
            <p>Usuário responsável por esta empresa.</p>
          </div>

          <div className="zunary-admin-owner-card">
            <div>
              <User size={22} />
            </div>

            <strong>{company.owner_name || "Sem nome"}</strong>
            <span>{company.owner_email || "Sem e-mail"}</span>

            <small>Role: {company.owner_role || "user"}</small>
          </div>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Assinatura</h2>
          <p>Última assinatura vinculada à empresa.</p>
        </div>

        {!subscription ? (
          <div className="zunary-empty-card">
            Nenhuma assinatura encontrada para esta empresa.
          </div>
        ) : (
          <div className="zunary-admin-subscription-panel">
            <div className="zunary-admin-subscription-main">
              <span>Plano</span>
              <h3>{subscription.plan_name || "Plano não encontrado"}</h3>

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

              <p>Vencimento: {formatDate(subscription.next_due_date)}</p>
            </div>

            <div className="zunary-admin-subscription-details">
              <div>
                <span>Asaas subscription</span>
                <strong>{subscription.asaas_subscription_id || "-"}</strong>
              </div>

              <div>
                <span>Asaas payment</span>
                <strong>{subscription.asaas_payment_id || "-"}</strong>
              </div>
            </div>

            <div className="zunary-admin-subscription-actions">
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

              {showSimulatePaymentButton && (
                <button
                  className="zunary-button"
                  onClick={handleSimulatePayment}
                  disabled={simulatingPayment}
                >
                  {simulatingPayment ? "Simulando..." : "Simular pagamento"}
                </button>
              )}

              {subscription.status !== "canceled" && (
                <button
                  className="zunary-button zunary-button-danger"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription
                    ? "Cancelando..."
                    : "Cancelar assinatura"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="zunary-admin-dashboard-grid">
        <section className="zunary-card">
          <div className="zunary-card-header">
            <h2>Serviços</h2>
            <p>Serviços cadastrados por esta empresa.</p>
          </div>

          {services.length === 0 ? (
            <div className="zunary-empty-card">Nenhum serviço cadastrado.</div>
          ) : (
            <div className="zunary-admin-list">
              {services.map((service) => (
                <div key={service.id} className="zunary-admin-list-item">
                  <div>
                    <strong>{service.name}</strong>

                    <span>
                      {service.duration_minutes} min •{" "}
                      {formatCurrency(service.price)}
                    </span>

                    <span>{service.is_active ? "Ativo" : "Inativo"}</span>

                    {service.description && <span>{service.description}</span>}
                  </div>

                  <time>{formatDateTime(service.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="zunary-card">
          <div className="zunary-card-header">
            <h2>Agendamentos recentes</h2>
            <p>Últimos agendamentos recebidos por esta empresa.</p>
          </div>

          {appointments.length === 0 ? (
            <div className="zunary-empty-card">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <div className="zunary-admin-list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="zunary-admin-list-item">
                  <div>
                    <strong>
                      {appointment.customer_name || "Cliente sem nome"}
                    </strong>

                    <span>
                      Serviço:{" "}
                      {appointment.service_name || "Serviço não encontrado"}
                    </span>

                    <span>
                      {formatDate(appointment.appointment_date)} •{" "}
                      {appointment.start_time.slice(0, 5)} até{" "}
                      {appointment.end_time.slice(0, 5)}
                    </span>

                    <strong
                      className={`zunary-status-pill ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </strong>

                    <span>
                      {appointment.customer_email || "Sem e-mail"} •{" "}
                      {appointment.customer_phone || "Sem telefone"}
                    </span>
                  </div>

                  <time>{formatDateTime(appointment.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}