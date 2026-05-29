import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
} from "lucide-react";
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

  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadCompany() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

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

  const generatedSlug = useMemo(() => {
    return slugify(name);
  }, [name]);

  const currentPublicBookingPath = company ? `/booking/${company.slug}` : "";
  const newPublicBookingPath = `/booking/${generatedSlug}`;

  const currentPublicBookingUrl =
    company && typeof window !== "undefined"
      ? `${window.location.origin}${currentPublicBookingPath}`
      : "";

  const newPublicBookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${newPublicBookingPath}`
      : "";

  const slugWillChange = Boolean(company) && generatedSlug !== company?.slug;

  async function handleCopyPublicLink() {
    if (!currentPublicBookingUrl) return;

    await navigator.clipboard.writeText(currentPublicBookingUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) return;

    if (!name.trim()) {
      setErrorMessage("Informe o nome da empresa.");
      return;
    }

    if (!generatedSlug) {
      setErrorMessage("O nome da empresa precisa gerar um link válido.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateCompany(company.id, {
        name: name.trim(),
        slug: generatedSlug,
        business_type: businessType,
        description: description.trim() || null,
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

  if (errorMessage && !company) {
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
          <span>Configurações</span>
          <h1>Empresa</h1>
          <p>
            Controle os dados públicos, o link de agendamento e a visibilidade
            da sua empresa.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompany}
          disabled={saving}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      <div className="zunary-settings-grid">
        <section className="zunary-card">
          <div className="zunary-card-header">
            <h2>Dados públicos</h2>
            <p>
              Essas informações aparecem para seus clientes na página pública de
              agendamento.
            </p>
          </div>

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
                Novo link: /booking/{generatedSlug || "nome-da-empresa"}
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
              <label>Descrição pública</label>
              <textarea
                className="zunary-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição curta da empresa"
              />
            </div>

            <button className="zunary-button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </section>

        <aside className="zunary-settings-side">
          <div
            className={
              publicBookingEnabled
                ? "zunary-settings-status-card active"
                : "zunary-settings-status-card inactive"
            }
          >
            <div>
              {publicBookingEnabled ? <Eye size={20} /> : <EyeOff size={20} />}

              <span>Página pública</span>
            </div>

            <strong>{publicBookingEnabled ? "Ativa" : "Desativada"}</strong>

            <p>
              {publicBookingEnabled
                ? "Clientes podem acessar seu link público e solicitar agendamentos."
                : "Clientes não conseguirão acessar sua página pública de agendamento."}
            </p>
          </div>

          <div className="zunary-card">
            <div className="zunary-card-header">
              <h2>Link público</h2>
              <p>Compartilhe este endereço com seus clientes.</p>
            </div>

            <div className="zunary-settings-link-preview">
              <span>Link atual</span>
              <strong>{currentPublicBookingPath}</strong>
            </div>

            {slugWillChange && (
              <div className="zunary-settings-link-warning">
                <strong>O link será alterado ao salvar</strong>
                <span>{newPublicBookingUrl}</span>
              </div>
            )}

            <div className="zunary-settings-actions">
              <button
                className="zunary-button zunary-button-secondary"
                onClick={handleCopyPublicLink}
                type="button"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar link"}
              </button>

              <a
                className="zunary-button"
                href={currentPublicBookingPath}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={16} />
                Abrir página
              </a>
            </div>
          </div>

          <div className="zunary-card">
            <div className="zunary-card-header">
              <h2>Publicação</h2>
              <p>Controle se sua página pública pode receber visitantes.</p>
            </div>

            <label className="zunary-settings-toggle">
              <div>
                <strong>Receber agendamentos</strong>
                <span>
                  Ative ou desative o acesso público ao link de agendamento.
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

            {!publicBookingEnabled && (
              <div className="zunary-settings-danger-note">
                Sua página pública ficará indisponível até você ativar novamente
                e salvar as configurações.
              </div>
            )}

            <button
              className="zunary-button"
              type="button"
              onClick={handleSubmit as unknown as () => void}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar publicação"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}