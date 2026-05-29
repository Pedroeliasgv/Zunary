import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Power,
  Trash2,
} from "lucide-react";
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

const WEEK_DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

function normalizeTime(time: string) {
  return time.slice(0, 5);
}

function isInvalidTimeRange(start: string, end: string) {
  return start >= end;
}

function getActiveRulesCount(rules: AvailabilityRule[]) {
  return rules.filter((rule) => rule.is_active).length;
}

export function AvailabilityForm({ companyId }: AvailabilityFormProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editDayOfWeek, setEditDayOfWeek] = useState(1);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("18:00");

  const [loadingRules, setLoadingRules] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadRules() {
    try {
      setLoadingRules(true);
      setErrorMessage("");

      const data = await getAvailabilityByCompany(companyId);
      setRules(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar disponibilidade."
      );
    } finally {
      setLoadingRules(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, [companyId]);

  const rulesByDay = useMemo(() => {
    return WEEK_DAYS.map((day) => {
      const dayRules = rules
        .filter((rule) => rule.day_of_week === day.value)
        .sort((a, b) =>
          normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
        );

      return {
        ...day,
        rules: dayRules,
        activeRules: dayRules.filter((rule) => rule.is_active),
      };
    });
  }, [rules]);

  function startEditing(rule: AvailabilityRule) {
    setEditingRuleId(rule.id);
    setEditDayOfWeek(rule.day_of_week);
    setEditStartTime(normalizeTime(rule.start_time));
    setEditEndTime(normalizeTime(rule.end_time));
    setErrorMessage("");
    setSuccessMessage("");
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

    if (isInvalidTimeRange(startTime, endTime)) {
      setErrorMessage("O horário de início precisa ser menor que o horário de fim.");
      return;
    }

    try {
      setCreating(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createAvailabilityRule({
        company_id: companyId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });

      setSuccessMessage("Disponibilidade adicionada com sucesso.");
      await loadRules();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao criar disponibilidade."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateRule(ruleId: string) {
    if (isInvalidTimeRange(editStartTime, editEndTime)) {
      setErrorMessage("O horário de início precisa ser menor que o horário de fim.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateAvailabilityRule(ruleId, {
        day_of_week: editDayOfWeek,
        start_time: editStartTime,
        end_time: editEndTime,
      });

      cancelEditing();
      setSuccessMessage("Disponibilidade atualizada com sucesso.");
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
    try {
      setUpdatingRuleId(rule.id);
      setErrorMessage("");
      setSuccessMessage("");

      await toggleAvailabilityRuleStatus(rule.id, !rule.is_active);
      setSuccessMessage(
        rule.is_active
          ? "Disponibilidade desativada."
          : "Disponibilidade ativada."
      );

      await loadRules();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao alterar status da disponibilidade."
      );
    } finally {
      setUpdatingRuleId(null);
    }
  }

  async function handleDelete(ruleId: string) {
    const confirmed = window.confirm(
      "Deseja remover esta disponibilidade? Se quiser ocultar temporariamente, use Desativar."
    );

    if (!confirmed) return;

    try {
      setUpdatingRuleId(ruleId);
      setErrorMessage("");
      setSuccessMessage("");

      await deleteAvailabilityRule(ruleId);
      setSuccessMessage("Disponibilidade removida com sucesso.");

      await loadRules();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao remover disponibilidade."
      );
    } finally {
      setUpdatingRuleId(null);
    }
  }

  return (
    <div className="zunary-page">
      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      <div className="zunary-availability-overview">
        <div>
          <CalendarDays size={20} />
          <span>Dias configurados</span>
          <strong>
            {rulesByDay.filter((day) => day.rules.length > 0).length}/7
          </strong>
        </div>

        <div>
          <CheckCircle2 size={20} />
          <span>Regras ativas</span>
          <strong>{getActiveRulesCount(rules)}</strong>
        </div>

        <div>
          <Clock size={20} />
          <span>Total de regras</span>
          <strong>{rules.length}</strong>
        </div>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Adicionar horário</h2>
          <p>
            Cadastre um período de atendimento. Você pode adicionar mais de um
            horário para o mesmo dia.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="zunary-availability-form">
          <div className="zunary-field">
            <label>Dia da semana</label>
            <select
              className="zunary-select"
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
            >
              {WEEK_DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
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

          <button className="zunary-button" type="submit" disabled={creating}>
            {creating ? "Salvando..." : "Adicionar horário"}
          </button>
        </form>
      </div>

      {loadingRules ? (
        <div className="zunary-card">Carregando horários...</div>
      ) : rules.length === 0 ? (
        <div className="zunary-empty-card">
          Nenhuma disponibilidade cadastrada. Adicione pelo menos um horário
          para sua página pública mostrar opções aos clientes.
        </div>
      ) : (
        <div className="zunary-availability-week">
          {rulesByDay.map((day) => (
            <section key={day.value} className="zunary-availability-day-card">
              <header>
                <div>
                  <span>{day.short}</span>
                  <h3>{getDayName(day.value)}</h3>
                </div>

                <strong>
                  {day.activeRules.length > 0
                    ? `${day.activeRules.length} ativo(s)`
                    : "Sem horário ativo"}
                </strong>
              </header>

              {day.rules.length === 0 ? (
                <p className="zunary-availability-empty-day">
                  Nenhum horário cadastrado para este dia.
                </p>
              ) : (
                <div className="zunary-availability-rules">
                  {day.rules.map((rule) => {
                    const isEditing = editingRuleId === rule.id;
                    const disabled = updatingRuleId === rule.id || saving;

                    return (
                      <article
                        key={rule.id}
                        className={
                          rule.is_active
                            ? "zunary-availability-rule active"
                            : "zunary-availability-rule inactive"
                        }
                      >
                        {isEditing ? (
                          <div className="zunary-availability-edit">
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
                                  {WEEK_DAYS.map((weekDay) => (
                                    <option
                                      key={weekDay.value}
                                      value={weekDay.value}
                                    >
                                      {weekDay.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

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
                                type="button"
                                onClick={() => handleUpdateRule(rule.id)}
                                disabled={saving}
                              >
                                {saving ? "Salvando..." : "Salvar"}
                              </button>

                              <button
                                className="zunary-button zunary-button-secondary"
                                type="button"
                                onClick={cancelEditing}
                                disabled={saving}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="zunary-availability-rule-info">
                              <span
                                className={
                                  rule.is_active
                                    ? "zunary-status-badge active"
                                    : "zunary-status-badge inactive"
                                }
                              >
                                {rule.is_active ? "Ativo" : "Inativo"}
                              </span>

                              <strong>
                                {normalizeTime(rule.start_time)} até{" "}
                                {normalizeTime(rule.end_time)}
                              </strong>
                            </div>

                            <div className="zunary-availability-rule-actions">
                              <button
                                className="zunary-button zunary-button-secondary"
                                type="button"
                                onClick={() => startEditing(rule)}
                                disabled={disabled}
                              >
                                <Edit3 size={15} />
                                Editar
                              </button>

                              <button
                                className={
                                  rule.is_active
                                    ? "zunary-button zunary-button-secondary"
                                    : "zunary-button"
                                }
                                type="button"
                                onClick={() => handleToggleStatus(rule)}
                                disabled={disabled}
                              >
                                <Power size={15} />
                                {rule.is_active ? "Desativar" : "Ativar"}
                              </button>

                              <button
                                className="zunary-button zunary-button-danger"
                                type="button"
                                onClick={() => handleDelete(rule.id)}
                                disabled={disabled}
                              >
                                <Trash2 size={15} />
                                Remover
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}