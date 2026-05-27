import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS } from "../../constants/appointment-status";
import {
  getAppointmentsByCompany,
  updateAppointmentStatus,
} from "../../lib/appointments";
import type { AppointmentStatus } from "../../types";

type AppointmentsTableProps = {
  companyId: string;
};

type StatusFilter = AppointmentStatus | "all";

export function AppointmentsTable({ companyId }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");

  async function loadAppointments() {
    setLoading(true);

    try {
      const data = await getAppointmentsByCompany(companyId);
      setAppointments(data || []);
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
    await updateAppointmentStatus(appointmentId, status);
    await loadAppointments();
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
      <div className="zunary-appointments-summary">
        <div>
          <span>Total</span>
          <strong>{statusCounts.total}</strong>
        </div>

        <div>
          <span>Pendentes</span>
          <strong>{statusCounts.pending}</strong>
        </div>

        <div>
          <span>Confirmados</span>
          <strong>{statusCounts.confirmed}</strong>
        </div>

        <div>
          <span>Cancelados</span>
          <strong>{statusCounts.canceled}</strong>
        </div>

        <div>
          <span>Concluídos</span>
          <strong>{statusCounts.completed}</strong>
        </div>
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
            >
              Limpar filtros
            </button>

            <button className="zunary-button" onClick={loadAppointments}>
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
        <div className="zunary-table-wrapper">
          <table className="zunary-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Contato</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <strong>{appointment.customers?.name || "-"}</strong>
                  </td>

                  <td>{appointment.services?.name || "-"}</td>

                  <td>{appointment.appointment_date}</td>

                  <td>
                    {appointment.start_time.slice(0, 5)} até{" "}
                    {appointment.end_time.slice(0, 5)}
                  </td>

                  <td>
                    {appointment.customers?.phone ||
                      appointment.customers?.email ||
                      "-"}
                  </td>

                  <td>
                    <select
                      className="zunary-select"
                      value={appointment.status}
                      onChange={(event) =>
                        handleStatusChange(
                          appointment.id,
                          event.target.value as AppointmentStatus
                        )
                      }
                    >
                      {Object.entries(APPOINTMENT_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}