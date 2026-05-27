import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getCurrentUserCompany } from "../lib/company";
import {
  cancelCompanySubscription,
  getActivePlans,
  getCompanyActiveSubscription,
  setCompanyPlan,
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

  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
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
        const subscriptionData = await getCompanyActiveSubscription(
          companyData.id
        );

        setSubscription(subscriptionData);
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

  async function handleChoosePlan(plan: Plan) {
    if (!company) {
      setErrorMessage("Crie uma empresa antes de escolher um plano.");
      return;
    }

    try {
      setSavingPlanId(plan.id);
      setErrorMessage("");
      setSuccessMessage("");

      await setCompanyPlan(company.id, plan.id);

      setSuccessMessage(`Plano ${plan.name} selecionado com sucesso.`);
      await loadPlansPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao selecionar plano."
      );
    } finally {
      setSavingPlanId(null);
    }
  }

  async function handleCancelSubscription() {
    if (!subscription) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar o plano atual? Sua página pública de agendamento ficará indisponível até você escolher um novo plano."
    );

    if (!confirmed) return;

    try {
      setCanceling(true);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelCompanySubscription(subscription.id);

      setSuccessMessage(
        "Plano cancelado com sucesso. Escolha um novo plano para reativar a página pública."
      );

      await loadPlansPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cancelar plano."
      );
    } finally {
      setCanceling(false);
    }
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
            A cobrança ainda não está ativa. Por enquanto, esta tela salva o
            plano escolhido para preparar a estrutura comercial da Zunary.
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
            onClick={handleCancelSubscription}
            disabled={canceling}
          >
            {canceling ? "Cancelando..." : "Cancelar plano"}
          </button>
        </div>
      ) : (
        <div className="zunary-plan-limit-alert">
          <strong>Nenhum plano ativo</strong>
          <span>
            Escolha um plano para liberar a página pública de agendamento e o
            cadastro de serviços.
          </span>
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
                onClick={() => handleChoosePlan(plan)}
                disabled={savingPlanId === plan.id || isCurrentPlan}
              >
                {savingPlanId === plan.id
                  ? "Salvando..."
                  : isCurrentPlan
                  ? "Plano atual"
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
          <h2>Observação importante</h2>
          <p>
            A seleção e o cancelamento de plano já ficam salvos no banco, mas
            ainda não há cobrança automática. A integração com pagamento entra em
            uma etapa futura.
          </p>
        </div>
      </div>
    </div>
  );
}