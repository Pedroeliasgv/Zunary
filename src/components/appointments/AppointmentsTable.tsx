import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { APPOINTMENT_STATUS_LABELS } from "../../constants/appointment-status";
import {
  getAppointmentsByCompany,
  sendAppointmentEmail,
  updateAppointmentStatus,
  updateAppointmentStatusWithReason,
} from "../../lib/appointments";
import type { AppointmentStatus } from "../../types";

type AppointmentsTableProps = {
  companyId: string;
};

type StatusFilter = AppointmentStatus | "all";

type AppointmentWithRelations = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string | null;
  cancellation_reason?: string | null;
  services?: {
    name?: string | null;
    duration_minutes?: number | null;
    price?: number | null;
  } | null;
  customers?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusClass(status: AppointmentStatus) {
  if (status === "pending") return "pending";
  if (status === "confirmed") return "confirmed";
  if (status === "canceled") return "canceled";
  if (status === "completed") return "completed";

  return "default";
}

function getStatusLabel(status: AppointmentStatus) {
  return APPOINTMENT_STATUS_LABELS[status] || status;
}

export function AppointmentsTable({ companyId }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<
    string | null
  >(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");

  const [cancelingAppointmentId, setCancelingAppointmentId] = useState<
    string | null
  >(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getAppointmentsByCompany(companyId);
      setAppointments((data || []) as AppointmentWithRelations[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar agendamentos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [companyId]);

  async function handleStatusChange(
    appointmentId: string,
    status: AppointmentStatus
  ) {
    const needsConfirmation =
      status === "completed" || status === "confirmed" || status === "pending";

    if (needsConfirmation) {
      const confirmed = window.confirm(
        `Deseja alterar este agendamento para "${getStatusLabel(status)}"?`
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingAppointmentId(appointmentId);
      setErrorMessage("");
      setSuccessMessage("");

      await updateAppointmentStatus(appointmentId, status);

      if (status === "confirmed") {
        try {
          await sendAppointmentEmail({
            appointmentId,
            type: "confirmed",
          });
        } catch (emailError) {
          console.warn(
            "Status atualizado, mas o e-mail de confirmação não foi enviado:",
            emailError
          );
        }
      }

      setSuccessMessage("Status do agendamento atualizado com sucesso.");
      await loadAppointments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar agendamento."
      );
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  function startCancelingAppointment(appointmentId: string) {
    setCancelingAppointmentId(appointmentId);
    setCancellationReason("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function cancelCancelingAppointment() {
    setCancelingAppointmentId(null);
    setCancellationReason("");
    setErrorMessage("");
  }

  async function handleCancelAppointment(appointmentId: string) {
    const trimmedReason = cancellationReason.trim();

    if (!trimmedReason) {
      setErrorMessage("Informe o motivo do cancelamento.");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?"
    );

    if (!confirmed) return;

    try {
      setUpdatingAppointmentId(appointmentId);
      setErrorMessage("");
      setSuccessMessage("");

      await updateAppointmentStatusWithReason({
        appointmentId,
        status: "canceled",
        cancellationReason: trimmedReason,
      });

      try {
        await sendAppointmentEmail({
          appointmentId,
          type: "canceled",
        });
      } catch (emailError) {
        console.warn(
          "Agendamento cancelado, mas o e-mail de cancelamento não foi enviado:",
          emailError
        );
      }

      setSuccessMessage("Agendamento cancelado com sucesso.");
      setCancelingAppointmentId(null);
      setCancellationReason("");

      await loadAppointments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cancelar agendamento."
      );
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  function clearFilters() {
    setStatusFilter("all");
    setDateFilter("");
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;

      const matchesDate =
        !dateFilter || appointment.appointment_date === dateFilter;

      return matchesStatus && matchesDate;
    });
  }, [appointments, statusFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      confirmed: appointments.filter((item) => item.status === "confirmed")
        .length,
      canceled: appointments.filter((item) => item.status === "canceled")
        .length,
      completed: appointments.filter((item) => item.status === "completed")
        .length,
    };
  }, [appointments]);

  if (loading) {
    return <div className="zunary-card">Carregando agendamentos...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="zunary-empty-card">
        Nenhum agendamento recebido ainda.
      </div>
    );
  }

  return (
    <div className="zunary-page">
      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      <div className="zunary-appointments-summary">
        <button
          className={statusFilter === "all" ? "active" : ""}
          onClick={() => setStatusFilter("all")}
          type="button"
        >
          <span>Total</span>
          <strong>{statusCounts.total}</strong>
        </button>

        <button
          className={statusFilter === "pending" ? "active" : ""}
          onClick={() => setStatusFilter("pending")}
          type="button"
        >
          <span>Pendentes</span>
          <strong>{statusCounts.pending}</strong>
        </button>

        <button
          className={statusFilter === "confirmed" ? "active" : ""}
          onClick={() => setStatusFilter("confirmed")}
          type="button"
        >
          <span>Confirmados</span>
          <strong>{statusCounts.confirmed}</strong>
        </button>

        <button
          className={statusFilter === "canceled" ? "active" : ""}
          onClick={() => setStatusFilter("canceled")}
          type="button"
        >
          <span>Cancelados</span>
          <strong>{statusCounts.canceled}</strong>
        </button>

        <button
          className={statusFilter === "completed" ? "active" : ""}
          onClick={() => setStatusFilter("completed")}
          type="button"
        >
          <span>Concluídos</span>
          <strong>{statusCounts.completed}</strong>
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Filtros</h2>
          <p>Filtre os agendamentos por status ou data.</p>
        </div>

        <div className="zunary-filters">
          <div className="zunary-field">
            <label>Status</label>
            <select
              className="zunary-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="canceled">Cancelado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div className="zunary-field">
            <label>Data</label>
            <input
              className="zunary-input"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </div>

          <div className="zunary-filter-actions">
            <button
              className="zunary-button zunary-button-secondary"
              onClick={clearFilters}
              type="button"
            >
              Limpar filtros
            </button>

            <button
              className="zunary-button"
              onClick={loadAppointments}
              type="button"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="zunary-empty-card">
          Nenhum agendamento encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="zunary-appointments-list">
          {filteredAppointments.map((appointment) => {
            const customerName =
              appointment.customers?.name || "Cliente sem nome";
            const customerPhone = appointment.customers?.phone || "";
            const customerEmail = appointment.customers?.email || "";
            const serviceName =
              appointment.services?.name || "Serviço não encontrado";
            const isCanceling = cancelingAppointmentId === appointment.id;
            const isUpdating = updatingAppointmentId === appointment.id;

            return (
              <article
                key={appointment.id}
                className="zunary-appointment-card"
              >
                <div className="zunary-appointment-main">
                  <div className="zunary-appointment-top">
                    <div>
                      <span
                        className={`zunary-appointment-status ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      <h3>{customerName}</h3>
                    </div>

                    <div className="zunary-appointment-date">
                      <CalendarDays size={16} />
                      {formatDate(appointment.appointment_date)}
                    </div>
                  </div>

                  <div className="zunary-appointment-info-grid">
                    <div>
                      <Clock size={16} />
                      <span>
                        {appointment.start_time.slice(0, 5)} até{" "}
                        {appointment.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div>
                      <CheckCircle2 size={16} />
                      <span>{serviceName}</span>
                    </div>

                    {customerPhone && (
                      <div>
                        <Phone size={16} />
                        <span>{customerPhone}</span>
                      </div>
                    )}

                    {customerEmail && (
                      <div>
                        <Mail size={16} />
                        <span>{customerEmail}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="zunary-appointment-notes">
                      <strong>Observações</strong>
                      <p>{appointment.notes}</p>
                    </div>
                  )}

                  {appointment.cancellation_reason && (
                    <div className="zunary-appointment-cancel-reason">
                      <strong>Motivo do cancelamento</strong>
                      <p>{appointment.cancellation_reason}</p>
                    </div>
                  )}

                  {isCanceling && (
                    <div className="zunary-appointment-cancel-box">
                      <div className="zunary-field">
                        <label>Motivo do cancelamento</label>
                        <textarea
                          className="zunary-textarea"
                          value={cancellationReason}
                          onChange={(event) =>
                            setCancellationReason(event.target.value)
                          }
                          placeholder="Ex: Cliente pediu cancelamento, horário indisponível, imprevisto..."
                          autoFocus
                        />
                      </div>

                      <div className="zunary-list-actions">
                        <button
                          className="zunary-button zunary-button-danger"
                          type="button"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? "Cancelando..."
                            : "Confirmar cancelamento"}
                        </button>

                        <button
                          className="zunary-button zunary-button-secondary"
                          type="button"
                          onClick={cancelCancelingAppointment}
                          disabled={isUpdating}
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="zunary-appointment-actions">
                  {appointment.status === "pending" && !isCanceling && (
                    <>
                      <button
                        className="zunary-button"
                        onClick={() =>
                          handleStatusChange(appointment.id, "confirmed")
                        }
                        disabled={isUpdating}
                        type="button"
                      >
                        <Check size={16} />
                        {isUpdating ? "Atualizando..." : "Confirmar"}
                      </button>

                      <button
                        className="zunary-button zunary-button-secondary"
                        onClick={() => startCancelingAppointment(appointment.id)}
                        disabled={isUpdating}
                        type="button"
                      >
                        <X size={16} />
                        Cancelar
                      </button>
                    </>
                  )}

                  {appointment.status === "confirmed" && !isCanceling && (
                    <>
                      <button
                        className="zunary-button"
                        onClick={() =>
                          handleStatusChange(appointment.id, "completed")
                        }
                        disabled={isUpdating}
                        type="button"
                      >
                        <CheckCircle2 size={16} />
                        {isUpdating ? "Atualizando..." : "Concluir"}
                      </button>

                      <button
                        className="zunary-button zunary-button-secondary"
                        onClick={() => startCancelingAppointment(appointment.id)}
                        disabled={isUpdating}
                        type="button"
                      >
                        <X size={16} />
                        Cancelar
                      </button>
                    </>
                  )}

                  {(appointment.status === "canceled" ||
                    appointment.status === "completed") && (
                    <select
                      className="zunary-select"
                      value={appointment.status}
                      onChange={(event) =>
                        handleStatusChange(
                          appointment.id,
                          event.target.value as AppointmentStatus
                        )
                      }
                      disabled={isUpdating}
                    >
                      {Object.entries(APPOINTMENT_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}