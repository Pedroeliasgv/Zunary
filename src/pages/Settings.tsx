import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { BUSINESS_TYPES } from "../constants/business-types";
import { getCurrentUserCompany, updateCompany } from "../lib/company";
import { slugify } from "../lib/utils";
import type { Company } from "../types";

export function Settings() {
  const [company, setCompany] = useState<Company | null>(null);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [publicBookingEnabled, setPublicBookingEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadCompany() {
    try {
      setLoading(true);

      const data = await getCurrentUserCompany();

      setCompany(data);

      if (data) {
        setName(data.name);
        setBusinessType(data.business_type || BUSINESS_TYPES[0]);
        setDescription(data.description || "");
        setPublicBookingEnabled(data.public_booking_enabled);
      }
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateCompany(company.id, {
        name,
        slug: slugify(name),
        business_type: businessType,
        description: description || null,
        public_booking_enabled: publicBookingEnabled,
      });

      setSuccessMessage("Configurações salvas com sucesso.");
      await loadCompany();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao salvar configurações."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="zunary-muted-text">Carregando configurações...</p>;
  }

  if (!company) {
    return (
      <div className="zunary-empty-card">
        Crie uma empresa primeiro no dashboard.
      </div>
    );
  }

  const publicBookingPath = `/booking/${company.slug}`;

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Configurações</span>
          <h1>Empresa</h1>
          <p>Edite as informações principais da sua empresa.</p>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Dados da empresa</h2>
          <p>
            Essas informações aparecem na página pública de agendamento.
          </p>
        </div>

        {errorMessage && <div className="zunary-error">{errorMessage}</div>}
        {successMessage && (
          <div className="zunary-success">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="zunary-form">
          <div className="zunary-field">
            <label>Nome da empresa</label>
            <input
              className="zunary-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome da empresa"
              required
            />

            <p className="zunary-help-text">
              Novo link público: /booking/{slugify(name)}
            </p>
          </div>

          <div className="zunary-field">
            <label>Tipo de negócio</label>
            <select
              className="zunary-select"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="zunary-field">
            <label>Descrição</label>
            <textarea
              className="zunary-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrição curta da empresa"
            />
          </div>

          <label className="zunary-toggle-row">
            <div>
              <strong>Página pública de agendamento</strong>
              <span>
                Quando estiver desativada, clientes não conseguirão acessar o
                link público.
              </span>
            </div>

            <input
              type="checkbox"
              checked={publicBookingEnabled}
              onChange={(event) =>
                setPublicBookingEnabled(event.target.checked)
              }
            />
          </label>

          <div className="zunary-link-box">
            <span>{window.location.origin}{publicBookingPath}</span>

            <a
              className="zunary-button"
              href={publicBookingPath}
              target="_blank"
              rel="noreferrer"
            >
              Abrir página
            </a>
          </div>

          <button className="zunary-button" type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </div>
  );
}