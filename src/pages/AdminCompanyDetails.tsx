import { useEffect, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminCompanyDetails,
  isCurrentUserAdmin,
  type AdminCompanyDetails as AdminCompanyDetailsType,
} from "../lib/admin";
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
  const [errorMessage, setErrorMessage] = useState("");

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

  if (errorMessage) {
    return <div className="zunary-error">{errorMessage}</div>;
  }

  if (!details?.company) {
    return (
      <div className="zunary-empty-card">
        Empresa não encontrada.
      </div>
    );
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
          <Link to="/admin/companies" className="zunary-button zunary-button-secondary">
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
                  <strong>{appointment.customer_name || "Cliente sem nome"}</strong>

                  <span>
                    Serviço: {appointment.service_name || "Serviço não encontrado"}
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