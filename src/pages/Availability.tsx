import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AvailabilityForm } from "../components/availability/AvailabilityForm";
import { getCurrentUserCompany } from "../lib/company";
import type { Company } from "../types";

export function Availability() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCompany() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getCurrentUserCompany();
      setCompany(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompany();
  }, []);

  if (loading) {
    return <p className="zunary-muted-text">Carregando disponibilidade...</p>;
  }

  if (errorMessage) {
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompany}
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
          <span>Disponibilidade</span>
          <h1>Horários de atendimento</h1>
          <p>
            Defina os dias e horários em que seus clientes poderão solicitar
            agendamentos.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompany}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <AvailabilityForm companyId={company.id} />
    </div>
  );
}