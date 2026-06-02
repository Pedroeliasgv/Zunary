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
import { uploadCompanyCover, uploadCompanyLogo } from "../lib/storage";
import { slugify } from "../lib/utils";
import type { Company, CompanyReview } from "../types";

const AMENITY_OPTIONS = [
  "Wi-Fi",
  "Ar-condicionado",
  "Estacionamento",
  "Aceita cartão",
  "Café",
  "Ambiente climatizado",
  "Acessibilidade",
  "Atendimento com hora marcada",
];

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

  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [publicBookingEnabled, setPublicBookingEnabled] = useState(true);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isBusy = saving || uploadingLogo || uploadingCover;

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

        setCoverUrl(data.cover_url || "");
        setCoverPreviewUrl(data.cover_url || "");

        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setAddress(data.address || "");
        setAmenities(data.amenities || []);
        setReviews(data.reviews || []);
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

  useEffect(() => {
    setCoverPreviewUrl(coverUrl);
  }, [coverUrl]);

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
  const previewCover = coverPreviewUrl.trim();
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
      setSuccessMessage(
        "Foto enviada com sucesso. Clique em salvar para aplicar."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao enviar foto."
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!company) return;

    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setErrorMessage("");
      setSuccessMessage("");

      const publicUrl = await uploadCompanyCover(company.id, file);

      setCoverUrl(publicUrl);
      setCoverPreviewUrl(publicUrl);
      setSuccessMessage(
        "Banner enviado com sucesso. Clique em salvar para aplicar."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao enviar banner."
      );
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    setLogoPreviewUrl("");
    setSuccessMessage("Foto removida. Clique em salvar para aplicar.");
  }

  function handleRemoveCover() {
    setCoverUrl("");
    setCoverPreviewUrl("");
    setSuccessMessage("Banner removido. Clique em salvar para aplicar.");
  }

  function toggleAmenity(amenity: string) {
    setAmenities((current) => {
      if (current.includes(amenity)) {
        return current.filter((item) => item !== amenity);
      }

      return [...current, amenity];
    });
  }

  function handleAddReview() {
    if (!reviewName.trim() || !reviewComment.trim()) {
      setErrorMessage("Preencha o nome e o comentário da avaliação.");
      return;
    }

    const newReview: CompanyReview = {
      id: crypto.randomUUID(),
      name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    };

    setReviews((current) => [newReview, ...current].slice(0, 6));
    setReviewName("");
    setReviewRating(5);
    setReviewComment("");
    setErrorMessage("");
    setSuccessMessage("Avaliação adicionada. Clique em salvar para aplicar.");
  }

  function handleRemoveReview(reviewId: string) {
    setReviews((current) => current.filter((review) => review.id !== reviewId));
    setSuccessMessage("Avaliação removida. Clique em salvar para aplicar.");
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
        cover_url: coverUrl.trim() || null,
        whatsapp: normalizeWhatsApp(whatsapp) || null,
        instagram: normalizeInstagram(instagram) || null,
        address: address.trim() || null,
        amenities,
        reviews,
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
          disabled={isBusy}
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
            <div className="zunary-settings-cover-section">
              <div className="zunary-settings-cover-preview">
                {previewCover ? (
                  <img src={previewCover} alt={name || "Banner da empresa"} />
                ) : (
                  <div>
                    <Image size={24} />
                    <span>Banner da página pública</span>
                  </div>
                )}
              </div>

              <div className="zunary-settings-cover-actions">
                <div>
                  <strong>Banner da empresa</strong>
                  <span>
                    Imagem horizontal exibida no topo da página pública.
                  </span>
                </div>

                <div>
                  <label className="zunary-button zunary-button-secondary">
                    <Upload size={16} />
                    {uploadingCover ? "Enviando..." : "Enviar banner"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleCoverUpload}
                      disabled={isBusy}
                    />
                  </label>

                  {previewCover && (
                    <button
                      className="zunary-button zunary-button-secondary"
                      type="button"
                      onClick={handleRemoveCover}
                      disabled={isBusy}
                    >
                      <Trash2 size={16} />
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <small>
                Use uma imagem horizontal. Recomendado: 1200x400px. Máximo:
                4MB.
              </small>
            </div>

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
                    disabled={isBusy}
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
                      disabled={isBusy}
                    />
                  </label>

                  {previewLogo && (
                    <button
                      className="zunary-button zunary-button-secondary"
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isBusy}
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
                  disabled={isBusy}
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
                  disabled={isBusy}
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
                disabled={isBusy}
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
                  disabled={isBusy}
                />
              </div>

              <div className="zunary-field">
                <label>Instagram</label>
                <input
                  className="zunary-input"
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  placeholder="@suaempresa"
                  disabled={isBusy}
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
                disabled={isBusy}
              />
            </div>

            <div className="zunary-settings-extra-section">
              <div className="zunary-card-header">
                <h2>Comodidades</h2>
                <p>Selecione os diferenciais que aparecem na página pública.</p>
              </div>

              <div className="zunary-amenities-grid">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = amenities.includes(amenity);

                  return (
                    <button
                      key={amenity}
                      type="button"
                      className={
                        selected
                          ? "zunary-amenity-chip selected"
                          : "zunary-amenity-chip"
                      }
                      onClick={() => toggleAmenity(amenity)}
                      disabled={isBusy}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="zunary-settings-extra-section">
              <div className="zunary-card-header">
                <h2>Avaliações em destaque</h2>
                <p>Adicione depoimentos curtos para gerar mais confiança.</p>
              </div>

              <div className="zunary-review-form">
                <div className="zunary-form-grid">
                  <div className="zunary-field">
                    <label>Nome do cliente</label>
                    <input
                      className="zunary-input"
                      value={reviewName}
                      onChange={(event) => setReviewName(event.target.value)}
                      placeholder="Ex: João Silva"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="zunary-field">
                    <label>Nota</label>
                    <select
                      className="zunary-select"
                      value={reviewRating}
                      onChange={(event) =>
                        setReviewRating(Number(event.target.value))
                      }
                      disabled={isBusy}
                    >
                      <option value={5}>5 estrelas</option>
                      <option value={4}>4 estrelas</option>
                      <option value={3}>3 estrelas</option>
                    </select>
                  </div>
                </div>

                <div className="zunary-field">
                  <label>Comentário</label>
                  <textarea
                    className="zunary-textarea"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Ex: Atendimento excelente e horário bem organizado."
                    disabled={isBusy}
                  />
                </div>

                <button
                  className="zunary-button zunary-button-secondary"
                  type="button"
                  onClick={handleAddReview}
                  disabled={isBusy}
                >
                  Adicionar avaliação
                </button>
              </div>

              {reviews.length > 0 && (
                <div className="zunary-settings-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="zunary-settings-review-item">
                      <div>
                        <strong>{review.name}</strong>
                        <span>{"★".repeat(review.rating)}</span>
                        <p>{review.comment}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveReview(review.id)}
                        disabled={isBusy}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="zunary-button" type="submit" disabled={isBusy}>
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </section>

        <aside className="zunary-settings-side">
          <div className="zunary-settings-preview-card">
            <div
              className="zunary-settings-preview-cover"
              style={
                previewCover
                  ? { backgroundImage: `url(${previewCover})` }
                  : undefined
              }
            >
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

                {amenities.length > 0 && (
                  <div>
                    <Check size={15} />
                    <span>{amenities.length} comodidade(s)</span>
                  </div>
                )}

                {reviews.length > 0 && (
                  <div>
                    <MessageCircle size={15} />
                    <span>{reviews.length} avaliação(ões)</span>
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
                disabled={isBusy}
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
                disabled={isBusy}
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
              disabled={isBusy}
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