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
      });

      setName("");
      setDescription("");

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
        <p>Cadastre sua empresa para começar a receber agendamentos.</p>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="zunary-form">
        <div className="zunary-field">
          <label>Nome da empresa</label>
          <input
            className="zunary-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Barbearia do Pedro"
            required
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
            placeholder="Uma breve descrição do seu negócio"
          />
        </div>

        <button className="zunary-button" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar empresa"}
        </button>
      </form>
    </div>
  );
}