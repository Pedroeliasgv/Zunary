import { useState } from "react";
import { createService } from "../../lib/services";

type ServiceFormProps = {
  companyId: string;
  onServiceCreated?: () => void;
};

export function ServiceForm({ companyId, onServiceCreated }: ServiceFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      await createService({
        company_id: companyId,
        name,
        description,
        duration_minutes: durationMinutes,
        price: price ? Number(price) : null,
      });

      setName("");
      setDescription("");
      setDurationMinutes(30);
      setPrice("");

      onServiceCreated?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar serviço."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="zunary-card">
      <div className="zunary-card-header">
        <h2>Novo serviço</h2>
        <p>Cadastre os serviços que poderão ser agendados pelos clientes.</p>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="zunary-form">
        <div className="zunary-field">
          <label>Nome do serviço</label>
          <input
            className="zunary-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Corte masculino"
            required
          />
        </div>

        <div className="zunary-field">
          <label>Descrição</label>
          <textarea
            className="zunary-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrição opcional"
          />
        </div>

        <div className="zunary-form-grid">
          <div className="zunary-field">
            <label>Duração em minutos</label>
            <input
              className="zunary-input"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              required
            />
          </div>

          <div className="zunary-field">
            <label>Preço</label>
            <input
              className="zunary-input"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Ex: 50"
            />
          </div>
        </div>

        <button className="zunary-button" type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar serviço"}
        </button>
      </form>
    </div>
  );
}