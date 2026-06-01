import { useState } from "react";
import { BUSINESS_TYPES } from "../../constants/business-types";
import { createCompany } from "../../lib/company";
import { slugify } from "../../lib/utils";

type CompanyFormProps = {
  onCompanyCreated?: () => void;
};

export function CompanyForm({ onCompanyCreated }: CompanyFormProps) {
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      await createCompany({
        name,
        slug: slugify(name),
        business_type: businessType,
        description,
        logo_url: logoUrl.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        address: address.trim() || undefined,
      });

      setName("");
      setDescription("");
      setLogoUrl("");
      setWhatsapp("");
      setInstagram("");
      setAddress("");

      onCompanyCreated?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar empresa."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="zunary-card">
      <div className="zunary-card-header">
        <h2>Criar empresa</h2>
        <p>
          Cadastre sua empresa para gerar uma página pública de agendamento.
        </p>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="zunary-form">
        <div className="zunary-form-grid">
          <div className="zunary-field">
            <label>Nome da empresa</label>
            <input
              className="zunary-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Barbearia do Pedro"
              required
              disabled={loading}
            />

            {name && (
              <p className="zunary-help-text">
                Link público: /booking/{slugify(name)}
              </p>
            )}
          </div>

          <div className="zunary-field">
            <label>Tipo de negócio</label>
            <select
              className="zunary-select"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
              disabled={loading}
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
          <label>Logo ou foto da empresa</label>
          <input
            className="zunary-input"
            type="url"
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://exemplo.com/logo.png"
            disabled={loading}
          />
          <p className="zunary-help-text">
            Por enquanto use um link de imagem. Depois vamos adicionar upload.
          </p>
        </div>

        <div className="zunary-field">
          <label>Descrição</label>
          <textarea
            className="zunary-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Uma breve descrição do seu negócio"
            disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="zunary-field">
            <label>Instagram</label>
            <input
              className="zunary-input"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="@suaempresa"
              disabled={loading}
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
            disabled={loading}
          />
        </div>

        <button className="zunary-button" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar empresa"}
        </button>
      </form>
    </div>
  );
}