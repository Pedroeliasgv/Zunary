import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { getCurrentUserCompany } from "../../lib/company";
import { getCompanyActiveSubscription } from "../../lib/plans";
import type { Company } from "../../types";
import type { CompanySubscription } from "../../lib/plans";

export function SubscriptionBanner() {
  const location = useLocation();

  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] =
    useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSubscriptionStatus() {
    try {
      setLoading(true);

      const companyData = await getCurrentUserCompany();
      setCompany(companyData);

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
    loadSubscriptionStatus();
  }, [location.pathname]);

  if (loading) {
    return null;
  }

  if (!company) {
    return null;
  }

  if (subscription) {
    return null;
  }

  if (location.pathname === "/plans") {
    return null;
  }

  return (
    <div className="zunary-subscription-banner">
      <div>
        <AlertCircle size={18} />

        <div>
          <strong>Plano não ativo</strong>
          <span>
            Escolha um plano para liberar a página pública de agendamento e os
            recursos do sistema.
          </span>
        </div>
      </div>

      <Link to="/plans">Escolher plano</Link>
    </div>
  );
}