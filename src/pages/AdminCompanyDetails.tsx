import { useEffect, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  adminUpdateCompanyPublicBooking,
  getAdminCompanyDetails,
  isCurrentUserAdmin,
  type AdminCompanyDetails as AdminCompanyDetailsType,
} from "../lib/admin";
import { cancelAsaasSubscription } from "../lib/billing";
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
  };

  return status ? labels[status] || status : "-";
}

export function AdminCompanyDetails() {
  const { id } = useParams();

  const [details, setDetails] = useState<AdminCompanyDetailsType | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [updatingPublicBooking, setUpdatingPublicBooking] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

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

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin / Empresa</span>
          <h1>{company.name}</h1>
          <p>Detalhes completos da empresa cadastrada na Zunary.</p>
        </div>

        <div className="zunary-admin-header-actions">
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

          <div style={{ marginTop: 16 }}>
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
          </div>
        </div>

        <div className="zunary-card">
          <div className="zunary-card-header">
            <h2>Dono da empresa</h2>
            <p>Usuário responsável por esta empresa.</p>
          </div>

          <div className="zunary-admin-details-list">
            <div>
              <span>Nome</span>
              <strong>{company.owner_name || "Sem nome"}</strong>
            </div>

            <div>
              <span>E-mail</span>
              <strong>{company.owner_email || "Sem e-mail"}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>{company.owner_role || "user"}</strong>
            </div>
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
          <div className="zunary-admin-details-list">
            <div>
              <span>Plano</span>
              <strong>{subscription.plan_name || "Plano não encontrado"}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {getStatusLabel(subscription.status)} /{" "}
                {getStatusLabel(subscription.billing_status)}
              </strong>
            </div>

            <div>
              <span>Vencimento</span>
              <strong>{formatDate(subscription.next_due_date)}</strong>
            </div>

            <div>
              <span>Asaas subscription</span>
              <strong>{subscription.asaas_subscription_id || "-"}</strong>
            </div>

            <div>
              <span>Asaas payment</span>
              <strong>{subscription.asaas_payment_id || "-"}</strong>
            </div>

            {subscription.checkout_url && (
              <div>
                <span>Pagamento</span>
                <a
                  href={subscription.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="zunary-admin-inline-link"
                >
                  <ExternalLink size={13} />
                  Abrir pagamento
                </a>
              </div>
            )}

            {subscription.status !== "canceled" && (
              <div>
                <span>Ação administrativa</span>

                <button
                  className="zunary-button zunary-button-danger"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription
                    ? "Cancelando..."
                    : "Cancelar assinatura"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="zunary-card">
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
                    {formatCurrency(service.price)} •{" "}
                    {service.is_active ? "Ativo" : "Inativo"}
                  </span>

                  {service.description && <span>{service.description}</span>}
                </div>

                <time>{formatDateTime(service.created_at)}</time>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="zunary-card">
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
                    {appointment.end_time.slice(0, 5)} •{" "}
                    {getStatusLabel(appointment.status)}
                  </span>

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
      </div>
    </div>
  );
}