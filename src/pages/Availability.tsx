import { useEffect, useState } from "react";
import { AvailabilityForm } from "../components/availability/AvailabilityForm";
import { getCurrentUserCompany } from "../lib/company";
import type { Company } from "../types";

export function Availability() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      const data = await getCurrentUserCompany();
      setCompany(data);
      setLoading(false);
    }

    loadCompany();
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
          <span>Disponibilidade</span>
          <h1>Horários de atendimento</h1>
          <p>Defina quando sua empresa estará disponível para receber agendamentos.</p>
        </div>
      </div>

      <AvailabilityForm companyId={company.id} />
    </div>
  );
}