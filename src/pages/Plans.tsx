import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  cancelAsaasSubscription,
  createAsaasCheckout,
  getBillingEventsByCompany,
  type BillingEvent,
} from "../lib/billing";
import { getCurrentUserCompany } from "../lib/company";
import {
  getActivePlans,
  getCompanyActiveSubscription,
  getCompanyPendingSubscription,
  type CompanySubscription,
  type Plan,
} from "../lib/plans";
import type { Company } from "../types";

function formatPlanPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${date}T00:00:00`));
}

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

function getSubscriptionStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Ativa",
    inactive: "Pendente",
    canceled: "Cancelada",
    past_due: "Vencida",
  };

  return status ? labels[status] || status : "-";
}

function getBillingStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Aguardando pagamento",
    paid: "Pago",
    overdue: "Vencido",
    canceled: "Cancelado",
    refunded: "Estornado",
    failed: "Falhou",
  };

  return status ? labels[status] || status : "-";
}

function getBillingStatusClass(status?: string | null) {
  if (status === "paid") return "paid";
  if (status === "pending") return "pending";
  if (status === "overdue") return "overdue";
  if (status === "canceled") return "canceled";
  if (status === "refunded") return "refunded";
  if (status === "failed") return "failed";

  return "default";
}

function getPlanFeatures(plan: Plan) {
  if (plan.slug === "starter") {
    return [
      "1 empresa",
      "Até 5 serviços ativos",
      "Página pública de agendamento",
      "Disponibilidade semanal",
      "Painel de agendamentos",
      "Suporte básico",
    ];
  }

  if (plan.slug === "pro") {
    return [
      "1 empresa",
      "Serviços ilimitados",
      "Página pública de agendamento",
      "Disponibilidade semanal",
      "Painel de agendamentos",
      "Filtros de agendamentos",
      "Personalização básica",
      "Suporte prioritário",
    ];
  }

  return [
    "1 empresa",
    "Serviços ilimitados",
    "Agendamentos ilimitados",
    "Recursos avançados futuros",
    "Prioridade em novas funções",
    "Suporte prioritário",
  ];
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export function Plans() {
  const [company, setCompany] = useState<Company | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);
  const [pendingSubscription, setPendingSubscription] =
    useState<CompanySubscription | null>(null);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const billingEnvironment = import.meta.env.VITE_BILLING_ENV || "sandbox";
  const isSandbox = billingEnvironment === "sandbox";
  const isProduction = billingEnvironment === "production";

  async function loadPlansPage() {
    try {
      setLoading(true);
      setErrorMessage("");

      const companyData = await getCurrentUserCompany();
      setCompany(companyData);

      const plansData = await getActivePlans();
      setPlans(plansData);

      if (companyData) {
        const [
          subscriptionData,
          pendingSubscriptionData,
          billingEventsData,
        ] = await Promise.all([
          getCompanyActiveSubscription(companyData.id),
          getCompanyPendingSubscription(companyData.id),
          getBillingEventsByCompany(companyData.id),
        ]);

        setSubscription(subscriptionData);
        setPendingSubscription(pendingSubscriptionData);
        setBillingEvents(billingEventsData);
      } else {
        setSubscription(null);
        setPendingSubscription(null);
        setBillingEvents([]);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar planos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlansPage();
  }, []);

  const currentPlanId = subscription?.plan_id;
  const hasPendingSubscription = Boolean(pendingSubscription);

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
  }, [plans]);

  function openCheckoutForm(plan: Plan) {
    if (!company) {
      setErrorMessage("Crie uma empresa antes de escolher um plano.");
      return;
    }

    if (hasPendingSubscription) {
      setErrorMessage(
        "Você já possui uma assinatura pendente. Abra o pagamento ou cancele a pendente antes de escolher outro plano."
      );
      return;
    }

    setSelectedPlan(plan);
    setErrorMessage("");
    setSuccessMessage("");

    setCustomerName(company.name);
  }

  function closeCheckoutForm() {
    setSelectedPlan(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerCpfCnpj("");
    setCustomerPhone("");
    setErrorMessage("");
  }

  async function handleCreateCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) {
      setErrorMessage("Crie uma empresa antes de escolher um plano.");
      return;
    }

    if (!selectedPlan) {
      setErrorMessage("Escolha um plano para continuar.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Informe o nome completo ou razão social.");
      return;
    }

    if (!customerEmail.trim()) {
      setErrorMessage("Informe o e-mail de cobrança.");
      return;
    }

    const cleanCpfCnpj = onlyNumbers(customerCpfCnpj);

    if (cleanCpfCnpj.length < 11) {
      setErrorMessage("Informe um CPF ou CNPJ válido, somente números.");
      return;
    }

    try {
      setCreatingCheckout(true);
      setErrorMessage("");
      setSuccessMessage("");

      const checkout = await createAsaasCheckout({
        company_id: company.id,
        plan_id: selectedPlan.id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_cpf_cnpj: cleanCpfCnpj,
        customer_phone: customerPhone ? onlyNumbers(customerPhone) : undefined,
      });

      setSuccessMessage(
        `Assinatura do plano ${selectedPlan.name} criada. Você será redirecionado para o pagamento.`
      );

      closeCheckoutForm();
      await loadPlansPage();

      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao criar assinatura no Asaas."
      );
    } finally {
      setCreatingCheckout(false);
    }
  }

  async function handleCancelSubscription(subscriptionId: string) {
    if (!company) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar esta assinatura? Ela também será cancelada no Asaas."
    );

    if (!confirmed) return;

    try {
      setCanceling(true);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelAsaasSubscription({
        company_id: company.id,
        subscription_id: subscriptionId,
      });

      setSuccessMessage(
        "Assinatura cancelada com sucesso no Asaas e na Zunary."
      );

      await loadPlansPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cancelar assinatura."
      );
    } finally {
      setCanceling(false);
    }
  }

  async function handleCancelPendingSubscription() {
    if (!company || !pendingSubscription) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar a assinatura pendente? Ela também será cancelada no Asaas."
    );

    if (!confirmed) return;

    try {
      setCanceling(true);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelAsaasSubscription({
        company_id: company.id,
        subscription_id: pendingSubscription.id,
      });

      setSuccessMessage("Assinatura pendente cancelada com sucesso.");
      setPendingSubscription(null);

      await loadPlansPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao cancelar assinatura pendente."
      );
    } finally {
      setCanceling(false);
    }
  }

  function handleOpenPayment(url?: string | null) {
    if (!url) {
      setErrorMessage(
        "Link de pagamento não encontrado. Cancele esta pendente e gere uma nova assinatura."
      );
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <p className="zunary-muted-text">Carregando planos...</p>;
  }

  if (!company) {
    return (
      <div className="zunary-page">
        <div className="zunary-page-header">
          <div>
            <span>Planos</span>
            <h1>Escolha um plano</h1>
            <p>Antes de assinar, crie uma empresa no dashboard.</p>
          </div>

          <button
            className="zunary-button zunary-button-secondary"
            onClick={loadPlansPage}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <div className="zunary-empty-card">
          Crie uma empresa primeiro no dashboard para conseguir contratar um
          plano.
        </div>
      </div>
    );
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Planos</span>
          <h1>Assinatura da Zunary</h1>
          <p>
            Escolha um plano, pague pelo Asaas e aguarde a confirmação
            automática pelo webhook.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadPlansPage}
          disabled={creatingCheckout || canceling}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      {isSandbox && (
        <div className="zunary-sandbox-alert">
          <strong>Ambiente sandbox</strong>
          <span>
            Os pagamentos estão em modo de teste/homologação. Nenhuma cobrança
            real será feita enquanto o Asaas estiver configurado como sandbox.
          </span>
        </div>
      )}

      {isProduction && (
        <div className="zunary-production-alert">
          <strong>Ambiente de produção</strong>
          <span>
            Os pagamentos estão em modo real. Assinaturas criadas aqui podem
            gerar cobranças reais para o cliente.
          </span>
        </div>
      )}

      <div className="zunary-plans-status-grid">
        <section className="zunary-plans-status-card">
          <div className="zunary-plans-status-icon">
            <CreditCard size={22} />
          </div>

          <span>Plano atual</span>

          <h2>{subscription?.plans?.name || "Sem plano ativo"}</h2>

          <p>
            {subscription?.plans
              ? "Sua empresa possui uma assinatura ativa e paga."
              : "Seu plano só será ativado quando o pagamento for confirmado pelo webhook do Asaas."}
          </p>

          {subscription?.plans && (
            <div className="zunary-subscription-badges">
              <strong className="zunary-status-pill paid">
                {getSubscriptionStatusLabel(subscription.status)}
              </strong>

              <strong
                className={`zunary-status-pill ${getBillingStatusClass(
                  subscription.billing_status
                )}`}
              >
                {getBillingStatusLabel(subscription.billing_status)}
              </strong>
            </div>
          )}

          {subscription?.plans && (
            <button
              className="zunary-button zunary-button-danger"
              onClick={() => handleCancelSubscription(subscription.id)}
              disabled={canceling}
            >
              {canceling ? "Cancelando..." : "Cancelar plano"}
            </button>
          )}
        </section>

        <section className="zunary-plans-status-card">
          <div className="zunary-plans-status-icon warning">
            <AlertTriangle size={22} />
          </div>

          <span>Assinatura pendente</span>

          <h2>{pendingSubscription?.plans?.name || "Nenhuma pendente"}</h2>

          <p>
            {pendingSubscription?.plans
              ? `Aguardando pagamento. Vencimento: ${formatDate(
                  pendingSubscription.next_due_date
                )}.`
              : "Quando você escolher um plano, a cobrança pendente aparecerá aqui."}
          </p>

          {pendingSubscription?.plans && (
            <>
              <div className="zunary-subscription-badges">
                <strong className="zunary-status-pill pending">
                  {getSubscriptionStatusLabel(pendingSubscription.status)}
                </strong>

                <strong
                  className={`zunary-status-pill ${getBillingStatusClass(
                    pendingSubscription.billing_status
                  )}`}
                >
                  {getBillingStatusLabel(pendingSubscription.billing_status)}
                </strong>
              </div>

              <div className="zunary-pending-actions">
                <button
                  className="zunary-button"
                  onClick={() =>
                    handleOpenPayment(pendingSubscription.checkout_url)
                  }
                  disabled={canceling}
                >
                  <ExternalLink size={16} />
                  Abrir pagamento
                </button>

                <button
                  className="zunary-button zunary-button-secondary"
                  onClick={handleCancelPendingSubscription}
                  disabled={canceling}
                >
                  {canceling ? "Cancelando..." : "Cancelar pendente"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedPlan && (
        <div className="zunary-card">
          <div className="zunary-modal-header">
            <div className="zunary-card-header">
              <h2>Dados de cobrança</h2>
              <p>
                Plano selecionado: <strong>{selectedPlan.name}</strong> —{" "}
                {formatPlanPrice(selectedPlan.price_monthly)}/mês
              </p>
            </div>

            <button
              className="zunary-icon-button"
              onClick={closeCheckoutForm}
              type="button"
              disabled={creatingCheckout}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateCheckout} className="zunary-form">
            <div className="zunary-form-grid">
              <div className="zunary-field">
                <label>Nome completo / razão social</label>
                <input
                  className="zunary-input"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nome do pagador"
                  required
                  disabled={creatingCheckout}
                />
              </div>

              <div className="zunary-field">
                <label>E-mail</label>
                <input
                  className="zunary-input"
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  disabled={creatingCheckout}
                />
              </div>
            </div>

            <div className="zunary-form-grid">
              <div className="zunary-field">
                <label>CPF/CNPJ</label>
                <input
                  className="zunary-input"
                  value={customerCpfCnpj}
                  onChange={(event) => setCustomerCpfCnpj(event.target.value)}
                  placeholder="Somente números"
                  required
                  disabled={creatingCheckout}
                />
              </div>

              <div className="zunary-field">
                <label>Telefone</label>
                <input
                  className="zunary-input"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="11999999999"
                  disabled={creatingCheckout}
                />
              </div>
            </div>

            <div className="zunary-plan-limit-alert">
              <strong>Ativação via webhook</strong>
              <span>
                A assinatura será criada no Asaas, mas o plano só será ativado
                após o Asaas enviar o evento de pagamento recebido ou confirmado.
              </span>
            </div>

            <button
              className="zunary-button"
              type="submit"
              disabled={creatingCheckout}
            >
              {creatingCheckout ? "Criando assinatura..." : "Criar assinatura"}
            </button>
          </form>
        </div>
      )}

      <div className="zunary-plans-grid">
        {sortedPlans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isFeatured = plan.slug === "pro";
          const disabled =
            isCurrentPlan || creatingCheckout || canceling || hasPendingSubscription;

          return (
            <div
              key={plan.id}
              className={
                isFeatured ? "zunary-plan-card featured" : "zunary-plan-card"
              }
            >
              {isFeatured && (
                <div className="zunary-plan-badge">Mais recomendado</div>
              )}

              {isCurrentPlan && (
                <div className="zunary-plan-current-badge">Plano atual</div>
              )}

              <div className="zunary-plan-header">
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>

              <div className="zunary-plan-price">
                <strong>{formatPlanPrice(plan.price_monthly)}</strong>
                <span>/mês</span>
              </div>

              <button
                className={
                  isCurrentPlan
                    ? "zunary-button zunary-button-secondary"
                    : "zunary-button"
                }
                onClick={() => openCheckoutForm(plan)}
                disabled={disabled}
              >
                {isCurrentPlan
                  ? "Plano atual"
                  : hasPendingSubscription
                  ? "Pendente em aberto"
                  : "Escolher plano"}
              </button>

              <div className="zunary-plan-features">
                {getPlanFeatures(plan).map((feature) => (
                  <div key={feature}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Como a ativação funciona</h2>
          <p>
            O plano não é ativado manualmente. Ele depende da confirmação de
            pagamento enviada pelo webhook do Asaas.
          </p>
        </div>

        <div className="zunary-billing-flow">
          <div>
            <Sparkles size={18} />
            <strong>1. Escolha o plano</strong>
            <span>A Zunary cria uma assinatura no Asaas.</span>
          </div>

          <div>
            <CreditCard size={18} />
            <strong>2. Pague a cobrança</strong>
            <span>O cliente conclui o pagamento no link do Asaas.</span>
          </div>

          <div>
            <ShieldCheck size={18} />
            <strong>3. Webhook ativa</strong>
            <span>O plano fica ativo quando o evento chega na Zunary.</span>
          </div>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Histórico de cobrança</h2>
          <p>Últimos eventos recebidos do Asaas para esta empresa.</p>
        </div>

        {billingEvents.length === 0 ? (
          <div className="zunary-empty-card">
            Nenhum evento de cobrança registrado ainda.
          </div>
        ) : (
          <div className="zunary-billing-events-list">
            {billingEvents.map((event) => (
              <div key={event.id} className="zunary-billing-event-item">
                <div>
                  <strong>{getEventLabel(event.event_type)}</strong>
                  <span>{event.event_type}</span>
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