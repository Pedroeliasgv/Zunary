import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  const [publicStatusFilter, setPublicStatusFilter] = useState("all");
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

  const activePublicPagesCount = useMemo(() => {
    return companies.filter((company) => company.public_booking_enabled).length;
  }, [companies]);

  const inactivePublicPagesCount = companies.length - activePublicPagesCount;

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        company.name.toLowerCase().includes(value) ||
        company.slug.toLowerCase().includes(value) ||
        company.owner_name?.toLowerCase().includes(value) ||
        company.owner_email?.toLowerCase().includes(value) ||
        company.business_type?.toLowerCase().includes(value);

      const matchesPublicStatus =
        publicStatusFilter === "all" ||
        (publicStatusFilter === "active" && company.public_booking_enabled) ||
        (publicStatusFilter === "inactive" && !company.public_booking_enabled);

      return matchesSearch && matchesPublicStatus;
    });
  }, [companies, search, publicStatusFilter]);

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
    return (
      <div className="zunary-page">
        <div className="zunary-error">{errorMessage}</div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompanies}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Empresas</h1>
          <p>Veja e gerencie todas as empresas cadastradas na Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompanies}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="zunary-admin-companies-overview">
        <div>
          <Building2 size={20} />
          <span>Total de empresas</span>
          <strong>{companies.length}</strong>
        </div>

        <div>
          <ExternalLink size={20} />
          <span>Páginas públicas ativas</span>
          <strong>{activePublicPagesCount}</strong>
        </div>

        <div>
          <Shield size={20} />
          <span>Páginas desativadas</span>
          <strong>{inactivePublicPagesCount}</strong>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Lista de empresas</h2>
          <p>Filtre por nome, dono, e-mail, slug ou tipo de negócio.</p>
        </div>

        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa, dono, e-mail, slug ou tipo..."
            />
          </div>

          <select
            className="zunary-select"
            value={publicStatusFilter}
            onChange={(event) => setPublicStatusFilter(event.target.value)}
          >
            <option value="all">Todas as páginas</option>
            <option value="active">Públicas ativas</option>
            <option value="inactive">Públicas desativadas</option>
          </select>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="zunary-empty-card">Nenhuma empresa encontrada.</div>
        ) : (
          <div className="zunary-admin-companies-list">
            {filteredCompanies.map((company) => (
              <article key={company.id} className="zunary-admin-company-card">
                <div className="zunary-admin-company-main">
                  <div className="zunary-admin-company-top">
                    <div>
                      <span
                        className={
                          company.public_booking_enabled
                            ? "zunary-status-badge active"
                            : "zunary-status-badge inactive"
                        }
                      >
                        {company.public_booking_enabled
                          ? "Página ativa"
                          : "Página desativada"}
                      </span>

                      <h3>{company.name}</h3>
                    </div>

                    <time>{formatDateTime(company.created_at)}</time>
                  </div>

                  <div className="zunary-admin-company-info">
                    <div>
                      <span>Dono</span>
                      <strong>{company.owner_name || "Sem nome"}</strong>
                      <small>{company.owner_email || "Sem e-mail"}</small>
                    </div>

                    <div>
                      <span>Tipo</span>
                      <strong>{company.business_type || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Link público</span>
                      <strong>/booking/{company.slug}</strong>
                    </div>
                  </div>
                </div>

                <div className="zunary-admin-company-actions">
                  <Link
                    to={`/admin/companies/${company.id}`}
                    className="zunary-button"
                  >
                    Ver detalhes
                  </Link>

                  <a
                    href={`/booking/${company.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="zunary-button zunary-button-secondary"
                  >
                    <ExternalLink size={15} />
                    Abrir página
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}