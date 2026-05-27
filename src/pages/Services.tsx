import { useEffect, useState } from "react";
import { ServiceForm } from "../components/services/ServiceForm";
import { ServicesList } from "../components/services/ServicesList";
import { getCurrentUserCompany } from "../lib/company";
import { getServicesByCompany } from "../lib/services";
import type { Company, Service } from "../types";

export function Services() {
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const companyData = await getCurrentUserCompany();
    setCompany(companyData);

    if (companyData) {
      const servicesData = await getServicesByCompany(companyData.id);
      setServices(servicesData);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

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

      <ServiceForm companyId={company.id} onServiceCreated={loadData} />
      <ServicesList services={services} onServiceDeleted={loadData} />
    </div>
  );
}