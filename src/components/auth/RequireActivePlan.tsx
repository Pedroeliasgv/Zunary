import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { isCurrentUserAdmin } from "../../lib/admin";
import { getCurrentUserCompany } from "../../lib/company";
import { getCompanyActiveSubscription } from "../../lib/plans";
import type { Company } from "../../types";
import type { CompanySubscription } from "../../lib/plans";

type RequireActivePlanProps = {
  children: React.ReactNode;
};

export function RequireActivePlan({ children }: RequireActivePlanProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPlanStatus() {
    try {
      setLoading(true);

      const [companyData, adminStatus] = await Promise.all([
        getCurrentUserCompany(),
        isCurrentUserAdmin(),
      ]);

      setCompany(companyData);
      setIsAdmin(adminStatus);

      if (companyData) {
        const subscriptionData = await getCompanyActiveSubscription(
          companyData.id
        );

        setSubscription(subscriptionData);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlanStatus();
  }, []);

  if (loading) {
    return <p className="zunary-muted-text">Verificando plano...</p>;
  }

  if (!company) {
    return (
      <div className="zunary-empty-card">
        Crie uma empresa primeiro no dashboard.
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  if (!subscription) {
    return (
      <div className="zunary-blocked-page">
        <div className="zunary-blocked-icon">
          <Lock size={24} />
        </div>

        <h1>Recurso bloqueado</h1>

        <p>
          Para acessar esta área, escolha um plano ativo. Sua página pública e os
          recursos operacionais ficam disponíveis após ativar um plano.
        </p>

        <Link to="/plans" className="zunary-button">
          Escolher plano
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}