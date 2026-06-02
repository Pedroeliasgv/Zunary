import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image,
  MapPin,
  MessageCircle,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { BUSINESS_TYPES } from "../constants/business-types";
import { getCurrentUserCompany, updateCompany } from "../lib/company";
import { uploadCompanyLogo } from "../lib/storage";
import { slugify } from "../lib/utils";
import type { Company } from "../types";

function normalizeInstagram(value: string) {
  return value.trim().replace(/^@/, "");
}

function normalizeWhatsApp(value: string) {
  return value.replace(/\D/g, "");
}

export function Settings() {
  const [company, setCompany] = useState<Company | null>(null);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [publicBookingEnabled, setPublicBookingEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setLogoUrl(data.logo_url || "");
        setLogoPreviewUrl(data.logo_url || "");
        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setAddress(data.address || "");
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

  useEffect(() => {
    setLogoPreviewUrl(logoUrl);
  }, [logoUrl]);

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

  const previewLogo = logoPreviewUrl.trim();
  const previewInstagram = normalizeInstagram(instagram);
  const previewWhatsApp = normalizeWhatsApp(whatsapp);

  async function handleCopyPublicLink() {
    if (!currentPublicBookingUrl) return;

    await navigator.clipboard.writeText(currentPublicBookingUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!company) return;

    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingLogo(true);
      setErrorMessage("");
      setSuccessMessage("");

      const publicUrl = await uploadCompanyLogo(company.id, file);

      setLogoUrl(publicUrl);
      setLogoPreviewUrl(publicUrl);
      setSuccessMessage("Foto enviada com sucesso. Clique em salvar para aplicar.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao enviar foto."
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    setLogoPreviewUrl("");
    setSuccessMessage("Foto removida. Clique em salvar para aplicar.");
  }

  async function saveSettings() {
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
        logo_url: logoUrl.trim() || null,
        whatsapp: normalizeWhatsApp(whatsapp) || null,
        instagram: normalizeInstagram(instagram) || null,
        address: address.trim() || null,
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSettings();
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
          <h1>Personalização</h1>
          <p>
            Ajuste a identidade da empresa, os contatos e a página pública de
            agendamento.
          </p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadCompany}
          disabled={saving || uploadingLogo}
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
            <h2>Perfil da empresa</h2>
            <p>
              Essas informações aparecem para seus clientes na página pública.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="zunary-form">
            <div className="zunary-settings-profile-photo-section">
              <div className="zunary-settings-avatar-wrapper">
                <div className="zunary-settings-avatar">
                  {previewLogo ? (
                    <img src={previewLogo} alt={name || "Foto da empresa"} />
                  ) : (
                    <Image size={30} />
                  )}
                </div>

                <label className="zunary-settings-avatar-camera">
                  <Camera size={16} />

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo || saving}
                  />
                </label>
              </div>

              <div className="zunary-settings-profile-photo-content">
                <strong>{name || "Sua empresa"}</strong>
                <span>{businessType || "Tipo de negócio"}</span>

                <div className="zunary-settings-profile-photo-actions">
                  <label className="zunary-button zunary-button-secondary">
                    <Upload size={16} />
                    {uploadingLogo ? "Enviando..." : "Enviar foto"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo || saving}
                    />
                  </label>

                  {previewLogo && (
                    <button
                      className="zunary-button zunary-button-secondary"
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo || saving}
                    >
                      <Trash2 size={16} />
                      Remover
                    </button>
                  )}
                </div>

                <small>PNG, JPG ou WEBP. Tamanho máximo recomendado: 2MB.</small>
              </div>
            </div>

            <div className="zunary-form-grid">
              <div className="zunary-field">
                <label>Nome da empresa</label>
                <input
                  className="zunary-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome da empresa"
                  required
                  disabled={saving || uploadingLogo}
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
                  disabled={saving || uploadingLogo}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="zunary-field">
              <label>Descrição pública</label>
              <textarea
                className="zunary-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição curta da empresa"
                disabled={saving || uploadingLogo}
              />
            </div>

            <div className="zunary-form-grid">
              <div className="zunary-field">
                <label>WhatsApp</label>
                <input
                  className="zunary-input"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="11999999999"
                  disabled={saving || uploadingLogo}
                />
              </div>

              <div className="zunary-field">
                <label>Instagram</label>
                <input
                  className="zunary-input"
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  placeholder="@suaempresa"
                  disabled={saving || uploadingLogo}
                />
              </div>
            </div>

            <div className="zunary-field">
              <label>Endereço ou bairro</label>
              <input
                className="zunary-input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Ex: Alphaville, Barueri - SP"
                disabled={saving || uploadingLogo}
              />
            </div>

            <button
              className="zunary-button"
              type="submit"
              disabled={saving || uploadingLogo}
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </section>

        <aside className="zunary-settings-side">
          <div className="zunary-settings-preview-card">
            <div className="zunary-settings-preview-cover">
              <div className="zunary-settings-preview-logo">
                {previewLogo ? (
                  <img src={previewLogo} alt={name || "Foto da empresa"} />
                ) : (
                  <Image size={24} />
                )}
              </div>
            </div>

            <div className="zunary-settings-preview-content">
              <span>{businessType || "Negócio local"}</span>
              <h2>{name || "Nome da empresa"}</h2>

              <p>
                {description ||
                  "Descrição curta da empresa aparecerá aqui para seus clientes."}
              </p>

              <div className="zunary-settings-preview-info">
                {address && (
                  <div>
                    <MapPin size={15} />
                    <span>{address}</span>
                  </div>
                )}

                {previewWhatsApp && (
                  <div>
                    <MessageCircle size={15} />
                    <span>{previewWhatsApp}</span>
                  </div>
                )}

                {previewInstagram && (
                  <div>
                    <MessageCircle size={15} />
                    <span>@{previewInstagram}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                disabled={saving || uploadingLogo}
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
                disabled={saving || uploadingLogo}
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
              onClick={saveSettings}
              disabled={saving || uploadingLogo}
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