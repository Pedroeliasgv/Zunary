import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Scissors, ShieldCheck, ToggleLeft } from "lucide-react";
import { ServiceForm } from "../components/services/ServiceForm";
import { ServicesList } from "../components/services/ServicesList";
import { isCurrentUserAdmin } from "../lib/admin";
import { getCurrentUserCompany } from "../lib/company";
import { getServicesByCompany } from "../lib/services";
import {
  canCreateMoreActiveServices,
  getCompanyActiveSubscription,
  type CompanySubscription,
} from "../lib/plans";
import type { Company, Service } from "../types";

export function Services() {
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const [companyData, adminStatus] = await Promise.all([
        getCurrentUserCompany(),
        isCurrentUserAdmin(),
      ]);

      setCompany(companyData);
      setIsAdmin(adminStatus);

      if (companyData) {
        const [servicesData, subscriptionData] = await Promise.all([
          getServicesByCompany(companyData.id),
          getCompanyActiveSubscription(companyData.id),
        ]);

        setServices(servicesData);
        setSubscription(subscriptionData);
      } else {
        setServices([]);
        setSubscription(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar serviços."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeServicesCount = useMemo(() => {
    return services.filter((service) => service.is_active).length;
  }, [services]);

  const inactiveServicesCount = useMemo(() => {
    return services.filter((service) => !service.is_active).length;
  }, [services]);

  const planLimit = useMemo(() => {
    if (isAdmin) {
      return {
        allowed: true,
        message: "",
      };
    }

    return canCreateMoreActiveServices(subscription, activeServicesCount);
  }, [isAdmin, subscription, activeServicesCount]);

  if (loading) {
    return <p className="zunary-muted-text">Carregando serviços...</p>;
  }

  if (errorMessage) {
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadData}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="zunary-empty-card">
        Crie uma empresa primeiro no dashboard.
      </div>
    );
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Serviços</span>
          <h1>Serviços cadastrados</h1>
          <p>
            Gerencie os serviços que seus clientes poderão escolher na página
            pública de agendamento.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadData}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="zunary-services-overview">
        <div>
          <Scissors size={20} />
          <span>Total de serviços</span>
          <strong>{services.length}</strong>
        </div>

        <div>
          <ShieldCheck size={20} />
          <span>Ativos</span>
          <strong>
            {activeServicesCount}
            {!isAdmin && subscription?.plans?.max_services
              ? `/${subscription.plans.max_services}`
              : ""}
          </strong>
        </div>

        <div>
          <ToggleLeft size={20} />
          <span>Inativos</span>
          <strong>{inactiveServicesCount}</strong>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Plano atual</h2>

          {isAdmin ? (
            <p>
              Você está usando uma conta <strong>admin</strong>. Os limites de
              plano não são aplicados para este usuário.
            </p>
          ) : subscription?.plans ? (
            <p>
              Você está no plano <strong>{subscription.plans.name}</strong>.{" "}
              {subscription.plans.allow_unlimited_services
                ? "Seu plano permite serviços ilimitados."
                : `Seu plano permite até ${subscription.plans.max_services} serviços ativos.`}
            </p>
          ) : (
            <p>
              Você ainda não possui um plano ativo. Escolha um plano para
              liberar o cadastro de serviços.
            </p>
          )}
        </div>

        <div className="zunary-services-limit-row">
          <div>
            <span>Serviços ativos</span>
            <strong>
              {activeServicesCount}
              {!isAdmin && subscription?.plans?.max_services
                ? `/${subscription.plans.max_services}`
                : ""}
            </strong>
          </div>

          {isAdmin && <div className="zunary-admin-badge">Modo admin</div>}

          {!isAdmin && !subscription && (
            <Link to="/plans" className="zunary-button">
              Escolher plano
            </Link>
          )}

          {!isAdmin &&
            subscription?.plans?.slug === "starter" &&
            !planLimit.allowed && (
              <Link to="/plans" className="zunary-button">
                Fazer upgrade
              </Link>
            )}
        </div>
      </div>

      <ServiceForm
        companyId={company.id}
        canCreateService={planLimit.allowed}
        blockedMessage={planLimit.message}
        onServiceCreated={loadData}
      />

      <ServicesList
        services={services}
        canActivateService={planLimit.allowed}
        blockedActivationMessage={planLimit.message}
        onServiceDeleted={loadData}
      />
    </div>
  );
}