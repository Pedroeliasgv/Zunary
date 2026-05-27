import { useEffect, useState } from "react";
import { AppointmentsTable } from "../components/appointments/AppointmentsTable";
import { getCurrentUserCompany } from "../lib/company";
import type { Company } from "../types";

export function Appointments() {
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
          <span>Agendamentos</span>
          <h1>Solicitações recebidas</h1>
          <p>Acompanhe os agendamentos enviados pelos clientes.</p>
        </div>
      </div>

      <AppointmentsTable companyId={company.id} />
    </div>
  );
}