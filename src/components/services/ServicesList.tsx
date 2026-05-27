import { useState } from "react";
import type { Service } from "../../types";
import {
  deleteService,
  toggleServiceStatus,
  updateService,
} from "../../lib/services";
import { formatCurrency } from "../../lib/utils";

type ServicesListProps = {
  services: Service[];
  onServiceDeleted?: () => void;
};

export function ServicesList({ services, onServiceDeleted }: ServicesListProps) {
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDurationMinutes, setEditDurationMinutes] = useState(30);
  const [editPrice, setEditPrice] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function startEditing(service: Service) {
    setEditingServiceId(service.id);
    setEditName(service.name);
    setEditDescription(service.description || "");
    setEditDurationMinutes(service.duration_minutes);
    setEditPrice(service.price !== null ? String(service.price) : "");
    setErrorMessage("");
  }

  function cancelEditing() {
    setEditingServiceId(null);
    setEditName("");
    setEditDescription("");
    setEditDurationMinutes(30);
    setEditPrice("");
    setErrorMessage("");
  }

  async function handleUpdateService(serviceId: string) {
    try {
      setSaving(true);
      setErrorMessage("");

      await updateService(serviceId, {
        name: editName,
        description: editDescription || null,
        duration_minutes: editDurationMinutes,
        price: editPrice ? Number(editPrice) : null,
      });

      cancelEditing();
      onServiceDeleted?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar serviço."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(service: Service) {
    await toggleServiceStatus(service.id, !service.is_active);
    onServiceDeleted?.();
  }

  async function handleDelete(serviceId: string) {
    const confirmed = window.confirm(
      "Deseja remover este serviço? Se ele já tiver agendamentos, é melhor apenas desativar."
    );

    if (!confirmed) return;

    await deleteService(serviceId);
    onServiceDeleted?.();
  }

  if (services.length === 0) {
    return (
      <div className="zunary-empty-card">
        Nenhum serviço cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="zunary-list">
      <div className="zunary-list-header">
        <h2>Serviços cadastrados</h2>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {services.map((service) => {
        const isEditing = editingServiceId === service.id;

        return (
          <div key={service.id} className="zunary-list-item">
            {isEditing ? (
              <div className="zunary-edit-form">
                <div className="zunary-form-grid">
                  <div className="zunary-field">
                    <label>Nome do serviço</label>
                    <input
                      className="zunary-input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      required
                    />
                  </div>

                  <div className="zunary-field">
                    <label>Duração em minutos</label>
                    <input
                      className="zunary-input"
                      type="number"
                      min={1}
                      value={editDurationMinutes}
                      onChange={(event) =>
                        setEditDurationMinutes(Number(event.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="zunary-form-grid">
                  <div className="zunary-field">
                    <label>Preço</label>
                    <input
                      className="zunary-input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPrice}
                      onChange={(event) => setEditPrice(event.target.value)}
                      placeholder="Ex: 50"
                    />
                  </div>

                  <div className="zunary-field">
                    <label>Status</label>
                    <input
                      className="zunary-input"
                      value={service.is_active ? "Ativo" : "Inativo"}
                      disabled
                    />
                  </div>
                </div>

                <div className="zunary-field">
                  <label>Descrição</label>
                  <textarea
                    className="zunary-textarea"
                    value={editDescription}
                    onChange={(event) =>
                      setEditDescription(event.target.value)
                    }
                    placeholder="Descrição opcional"
                  />
                </div>

                <div className="zunary-list-actions">
                  <button
                    className="zunary-button"
                    onClick={() => handleUpdateService(service.id)}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <button
                    className="zunary-button zunary-button-secondary"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="zunary-list-title-row">
                    <h3>{service.name}</h3>

                    <span
                      className={
                        service.is_active
                          ? "zunary-status-badge active"
                          : "zunary-status-badge inactive"
                      }
                    >
                      {service.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <p>{service.description || "Sem descrição"}</p>

                  <div className="zunary-list-meta">
                    {service.duration_minutes} minutos •{" "}
                    {formatCurrency(service.price)}
                  </div>
                </div>

                <div className="zunary-list-actions">
                  <button
                    className="zunary-button zunary-button-secondary"
                    onClick={() => startEditing(service)}
                  >
                    Editar
                  </button>

                  <button
                    className={
                      service.is_active
                        ? "zunary-button zunary-button-secondary"
                        : "zunary-button"
                    }
                    onClick={() => handleToggleStatus(service)}
                  >
                    {service.is_active ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    className="zunary-button zunary-button-danger"
                    onClick={() => handleDelete(service.id)}
                  >
                    Remover
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}