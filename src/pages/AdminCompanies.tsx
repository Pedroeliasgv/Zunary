import { useEffect, useState } from "react";
import { ExternalLink, Search, Shield } from "lucide-react";
import {
  getAdminCompanies,
  isCurrentUserAdmin,
  type AdminCompany,
} from "../lib/admin";

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function AdminCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCompanies() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminCompanies();
      setCompanies(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar empresas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return (
      company.name.toLowerCase().includes(value) ||
      company.slug.toLowerCase().includes(value) ||
      company.owner_name?.toLowerCase().includes(value) ||
      company.owner_email?.toLowerCase().includes(value)
    );
  });

  if (loading) {
    return <p className="zunary-muted-text">Carregando empresas...</p>;
  }

  if (!admin) {
    return (
      <div className="zunary-blocked-page">
        <div className="zunary-blocked-icon">
          <Shield size={24} />
        </div>

        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva para usuários admin/master da Zunary.</p>
      </div>
    );
  }

  if (errorMessage) {
    return <div className="zunary-error">{errorMessage}</div>;
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Empresas</h1>
          <p>Veja todas as empresas cadastradas na Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompanies}
        >
          Atualizar
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa, dono, e-mail ou slug..."
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="zunary-empty-card">Nenhuma empresa encontrada.</div>
        ) : (
          <div className="zunary-admin-list">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="zunary-admin-list-item">
                <div>
                  <strong>{company.name}</strong>

                  <span>
                    Dono: {company.owner_name || "Sem nome"} •{" "}
                    {company.owner_email || "Sem e-mail"}
                  </span>

                  <span>
                    Tipo: {company.business_type || "Não informado"} • Slug:
                    /booking/{company.slug}
                  </span>

                  <span>
                    Status:{" "}
                    {company.public_booking_enabled
                      ? "Página pública ativa"
                      : "Página pública desativada"}
                  </span>
                </div>

                <div className="zunary-admin-company-actions">
                  <time>{formatDateTime(company.created_at)}</time>

                  <a
                    href={`/booking/${company.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="zunary-admin-inline-link"
                  >
                    <ExternalLink size={13} />
                    Abrir página
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}