import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceForm } from "../components/services/ServiceForm";
import { ServicesList } from "../components/services/ServicesList";
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

  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const companyData = await getCurrentUserCompany();
    setCompany(companyData);

    if (companyData) {
      const [servicesData, subscriptionData] = await Promise.all([
        getServicesByCompany(companyData.id),
        getCompanyActiveSubscription(companyData.id),
      ]);

      setServices(servicesData);
      setSubscription(subscriptionData);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeServicesCount = useMemo(() => {
    return services.filter((service) => service.is_active).length;
  }, [services]);

  const planLimit = useMemo(() => {
    return canCreateMoreActiveServices(subscription, activeServicesCount);
  }, [subscription, activeServicesCount]);

  if (loading) {
    return <p className="zunary-muted-text">Carregando...</p>;
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
          <p>Gerencie os serviços que seus clientes poderão agendar.</p>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Plano atual</h2>

          {subscription?.plans ? (
            <p>
              Você está no plano <strong>{subscription.plans.name}</strong>.{" "}
              {subscription.plans.allow_unlimited_services
                ? "Seu plano permite serviços ilimitados."
                : `Seu plano permite até ${subscription.plans.max_services} serviços ativos.`}
            </p>
          ) : (
            <p>
              Você ainda não escolheu um plano. Escolha um plano para liberar o
              cadastro de serviços.
            </p>
          )}
        </div>

        <div className="zunary-services-limit-row">
          <div>
            <span>Serviços ativos</span>
            <strong>
              {activeServicesCount}
              {subscription?.plans?.max_services
                ? `/${subscription.plans.max_services}`
                : ""}
            </strong>
          </div>

          {!subscription && (
            <Link to="/plans" className="zunary-button">
              Escolher plano
            </Link>
          )}

          {subscription?.plans?.slug === "starter" && !planLimit.allowed && (
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