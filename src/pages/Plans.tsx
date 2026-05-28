import { useEffect, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { createAsaasCheckout } from "../lib/billing";
import { getCurrentUserCompany } from "../lib/company";
import {
  cancelCompanySubscription,
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

export function Plans() {
  const [company, setCompany] = useState<Company | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);
  const [pendingSubscription, setPendingSubscription] =
    useState<CompanySubscription | null>(null);

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

  async function loadPlansPage() {
    try {
      setLoading(true);
      setErrorMessage("");

      const companyData = await getCurrentUserCompany();
      setCompany(companyData);

      const plansData = await getActivePlans();
      setPlans(plansData);

      if (companyData) {
        const [subscriptionData, pendingSubscriptionData] = await Promise.all([
          getCompanyActiveSubscription(companyData.id),
          getCompanyPendingSubscription(companyData.id),
        ]);

        setSubscription(subscriptionData);
        setPendingSubscription(pendingSubscriptionData);
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

  function openCheckoutForm(plan: Plan) {
    setSelectedPlan(plan);
    setErrorMessage("");
    setSuccessMessage("");

    if (company) {
      setCustomerName(company.name);
    }
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

    try {
      setCreatingCheckout(true);
      setErrorMessage("");
      setSuccessMessage("");

      const checkout = await createAsaasCheckout({
        company_id: company.id,
        plan_id: selectedPlan.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_cpf_cnpj: customerCpfCnpj,
        customer_phone: customerPhone || undefined,
      });

      setSuccessMessage(
        `Assinatura do plano ${selectedPlan.name} criada no Asaas. Você será redirecionado para o pagamento.`
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
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar esta assinatura? A página pública de agendamento ficará indisponível até um plano ser ativado."
    );

    if (!confirmed) return;

    try {
      setCanceling(true);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelCompanySubscription(subscriptionId);

      setSuccessMessage(
        "Assinatura cancelada com sucesso. Escolha um novo plano para continuar."
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

  function handleOpenPayment(url?: string | null) {
    if (!url) {
      setErrorMessage(
        "Link de pagamento não encontrado. Gere uma nova assinatura."
      );
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <p className="zunary-muted-text">Carregando planos...</p>;
  }

  const currentPlanId = subscription?.plan_id;

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Planos</span>
          <h1>Escolha o melhor plano</h1>
          <p>
            A escolha do plano cria uma assinatura real no Asaas em modo
            sandbox.
          </p>
        </div>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      {subscription?.plans ? (
        <div className="zunary-card">
          <div className="zunary-card-header">
            <h2>Plano atual</h2>
            <p>
              Sua empresa está usando o plano{" "}
              <strong>{subscription.plans.name}</strong>. Se cancelar, a página
              pública de agendamento ficará indisponível.
            </p>
          </div>

          <button
            className="zunary-button zunary-button-danger"
            onClick={() => handleCancelSubscription(subscription.id)}
            disabled={canceling}
          >
            {canceling ? "Cancelando..." : "Cancelar plano"}
          </button>
        </div>
      ) : (
        <div className="zunary-plan-limit-alert">
          <strong>Nenhum plano ativo</strong>
          <span>
            Escolha um plano para criar a assinatura no Asaas. O plano será
            ativado quando o pagamento for confirmado pelo webhook.
          </span>
        </div>
      )}

      {pendingSubscription?.plans && (
        <div className="zunary-pending-subscription-card">
          <div>
            <span>Assinatura pendente</span>
            <h2>{pendingSubscription.plans.name}</h2>
            <p>
              Aguardando pagamento da assinatura. Vencimento:{" "}
              <strong>{formatDate(pendingSubscription.next_due_date)}</strong>.
            </p>
          </div>

          <div className="zunary-pending-actions">
            <button
              className="zunary-button"
              onClick={() =>
                handleOpenPayment(pendingSubscription.checkout_url)
              }
            >
              <ExternalLink size={16} />
              Abrir pagamento
            </button>

            <button
              className="zunary-button zunary-button-secondary"
              onClick={() => handleCancelSubscription(pendingSubscription.id)}
              disabled={canceling}
            >
              {canceling ? "Cancelando..." : "Cancelar pendente"}
            </button>
          </div>
        </div>
      )}

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
                />
              </div>

              <div className="zunary-field">
                <label>Telefone</label>
                <input
                  className="zunary-input"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="11999999999"
                />
              </div>
            </div>

            <div className="zunary-plan-limit-alert">
              <strong>Ambiente sandbox</strong>
              <span>
                Esta etapa cria a assinatura no Asaas. A ativação do plano
                acontece quando o Asaas enviar o webhook de pagamento recebido ou
                confirmado.
              </span>
            </div>

            <button
              className="zunary-button"
              type="submit"
              disabled={creatingCheckout}
            >
              {creatingCheckout ? "Criando assinatura..." : "Continuar"}
            </button>
          </form>
        </div>
      )}

      <div className="zunary-plans-grid">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isFeatured = plan.slug === "pro";

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
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? "Plano atual" : "Escolher plano"}
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
          <h2>Observação importante</h2>
          <p>
            A assinatura é criada no Asaas, mas o plano só será ativado após
            confirmação de pagamento pelo webhook.
          </p>
        </div>
      </div>
    </div>
  );
}