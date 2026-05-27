import { useEffect, useState } from "react";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getAvailabilityByCompany,
  toggleAvailabilityRuleStatus,
  updateAvailabilityRule,
} from "../../lib/availability";
import type { AvailabilityRule } from "../../types";
import { getDayName } from "../../lib/utils";

type AvailabilityFormProps = {
  companyId: string;
};

export function AvailabilityForm({ companyId }: AvailabilityFormProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editDayOfWeek, setEditDayOfWeek] = useState(1);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("18:00");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadRules() {
    const data = await getAvailabilityByCompany(companyId);
    setRules(data);
  }

  useEffect(() => {
    loadRules();
  }, [companyId]);

  function startEditing(rule: AvailabilityRule) {
    setEditingRuleId(rule.id);
    setEditDayOfWeek(rule.day_of_week);
    setEditStartTime(rule.start_time.slice(0, 5));
    setEditEndTime(rule.end_time.slice(0, 5));
    setErrorMessage("");
  }

  function cancelEditing() {
    setEditingRuleId(null);
    setEditDayOfWeek(1);
    setEditStartTime("09:00");
    setEditEndTime("18:00");
    setErrorMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      await createAvailabilityRule({
        company_id: companyId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });

      await loadRules();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao criar disponibilidade."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRule(ruleId: string) {
    try {
      setSaving(true);
      setErrorMessage("");

      await updateAvailabilityRule(ruleId, {
        day_of_week: editDayOfWeek,
        start_time: editStartTime,
        end_time: editEndTime,
      });

      cancelEditing();
      await loadRules();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar disponibilidade."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(rule: AvailabilityRule) {
    await toggleAvailabilityRuleStatus(rule.id, !rule.is_active);
    await loadRules();
  }

  async function handleDelete(ruleId: string) {
    const confirmed = window.confirm(
      "Deseja remover esta disponibilidade? Se quiser ocultar temporariamente, use Desativar."
    );

    if (!confirmed) return;

    await deleteAvailabilityRule(ruleId);
    await loadRules();
  }

  return (
    <div className="zunary-page">
      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Nova disponibilidade</h2>
          <p>Defina os dias e horários em que sua empresa atende.</p>
        </div>

        {errorMessage && <div className="zunary-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="zunary-form-grid-4">
          <div className="zunary-field">
            <label>Dia</label>
            <select
              className="zunary-select"
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
            >
              <option value={0}>Domingo</option>
              <option value={1}>Segunda-feira</option>
              <option value={2}>Terça-feira</option>
              <option value={3}>Quarta-feira</option>
              <option value={4}>Quinta-feira</option>
              <option value={5}>Sexta-feira</option>
              <option value={6}>Sábado</option>
            </select>
          </div>

          <div className="zunary-field">
            <label>Início</label>
            <input
              className="zunary-input"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </div>

          <div className="zunary-field">
            <label>Fim</label>
            <input
              className="zunary-input"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
            />
          </div>

          <button className="zunary-button" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      </div>

      {rules.length === 0 ? (
        <div className="zunary-empty-card">
          Nenhuma disponibilidade cadastrada.
        </div>
      ) : (
        <div className="zunary-list">
          <div className="zunary-list-header">
            <h2>Horários cadastrados</h2>
          </div>

          {rules.map((rule) => {
            const isEditing = editingRuleId === rule.id;

            return (
              <div key={rule.id} className="zunary-list-item">
                {isEditing ? (
                  <div className="zunary-edit-form">
                    <div className="zunary-form-grid">
                      <div className="zunary-field">
                        <label>Dia</label>
                        <select
                          className="zunary-select"
                          value={editDayOfWeek}
                          onChange={(event) =>
                            setEditDayOfWeek(Number(event.target.value))
                          }
                        >
                          <option value={0}>Domingo</option>
                          <option value={1}>Segunda-feira</option>
                          <option value={2}>Terça-feira</option>
                          <option value={3}>Quarta-feira</option>
                          <option value={4}>Quinta-feira</option>
                          <option value={5}>Sexta-feira</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>

                      <div className="zunary-field">
                        <label>Status</label>
                        <input
                          className="zunary-input"
                          value={rule.is_active ? "Ativo" : "Inativo"}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="zunary-form-grid">
                      <div className="zunary-field">
                        <label>Início</label>
                        <input
                          className="zunary-input"
                          type="time"
                          value={editStartTime}
                          onChange={(event) =>
                            setEditStartTime(event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="zunary-field">
                        <label>Fim</label>
                        <input
                          className="zunary-input"
                          type="time"
                          value={editEndTime}
                          onChange={(event) =>
                            setEditEndTime(event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="zunary-list-actions">
                      <button
                        className="zunary-button"
                        onClick={() => handleUpdateRule(rule.id)}
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
                        <h3>{getDayName(rule.day_of_week)}</h3>

                        <span
                          className={
                            rule.is_active
                              ? "zunary-status-badge active"
                              : "zunary-status-badge inactive"
                          }
                        >
                          {rule.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p>
                        {rule.start_time.slice(0, 5)} até{" "}
                        {rule.end_time.slice(0, 5)}
                      </p>
                    </div>

                    <div className="zunary-list-actions">
                      <button
                        className="zunary-button zunary-button-secondary"
                        onClick={() => startEditing(rule)}
                      >
                        Editar
                      </button>

                      <button
                        className={
                          rule.is_active
                            ? "zunary-button zunary-button-secondary"
                            : "zunary-button"
                        }
                        onClick={() => handleToggleStatus(rule)}
                      >
                        {rule.is_active ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        className="zunary-button zunary-button-danger"
                        onClick={() => handleDelete(rule.id)}
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
      )}
    </div>
  );
}