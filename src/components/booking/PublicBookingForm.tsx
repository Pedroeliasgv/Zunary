import { useEffect, useMemo, useState } from "react";
import {
  createPublicAppointment,
  getBookedTimesByCompanyAndDate,
} from "../../lib/appointments";
import { getActiveAvailabilityByCompany } from "../../lib/availability";
import {
  getPublicBookingStatus,
  type PublicBookingStatusReason,
} from "../../lib/company";
import { getActiveServicesByCompany } from "../../lib/services";
import { addMinutesToTime, formatCurrency, getDayName } from "../../lib/utils";
import type { AvailabilityRule, Company, Service } from "../../types";

type PublicBookingFormProps = {
  slug: string;
};

function getPublicBookingErrorMessage(reason?: PublicBookingStatusReason) {
  if (reason === "company_not_found") {
    return {
      title: "Empresa não encontrada",
      description:
        "O link de agendamento que você acessou não existe ou foi alterado.",
    };
  }

  if (reason === "booking_disabled") {
    return {
      title: "Agendamento indisponível",
      description:
        "Esta empresa desativou temporariamente a página pública de agendamento.",
    };
  }

  if (reason === "plan_inactive") {
    return {
      title: "Agendamento temporariamente indisponível",
      description:
        "Esta empresa precisa regularizar o plano para receber novos agendamentos.",
    };
  }

  return {
    title: "Página indisponível",
    description:
      "Não foi possível carregar esta página de agendamento no momento.",
  };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function generateTimeSlots(
  rules: AvailabilityRule[],
  durationMinutes: number
) {
  const slots: string[] = [];

  rules.forEach((rule) => {
    const start = timeToMinutes(rule.start_time.slice(0, 5));
    const end = timeToMinutes(rule.end_time.slice(0, 5));

    for (
      let current = start;
      current + durationMinutes <= end;
      current += durationMinutes
    ) {
      slots.push(minutesToTime(current));
    }
  });

  return slots;
}

export function PublicBookingForm({ slug }: PublicBookingFormProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [publicErrorReason, setPublicErrorReason] =
    useState<PublicBookingStatusReason>();

  async function loadPublicData() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setPublicErrorReason(undefined);

      const publicStatus = await getPublicBookingStatus(slug);

      if (!publicStatus?.can_book || !publicStatus.company_id) {
        setPublicErrorReason(publicStatus?.reason);
        setCompany(null);
        return;
      }

      const companyData = {
        id: publicStatus.company_id,
        owner_id: publicStatus.owner_id,
        name: publicStatus.name,
        slug: publicStatus.slug,
        business_type: publicStatus.business_type,
        description: publicStatus.description,
        public_booking_enabled: publicStatus.public_booking_enabled,
        created_at: publicStatus.created_at,
        updated_at: publicStatus.updated_at,
      } as Company;

      setCompany(companyData);

      const [servicesData, availabilityData] = await Promise.all([
        getActiveServicesByCompany(companyData.id),
        getActiveAvailabilityByCompany(companyData.id),
      ]);

      setServices(servicesData);
      setAvailability(availabilityData);

      if (servicesData.length > 0) {
        setServiceId(servicesData[0].id);
      }
    } catch {
      setPublicErrorReason(undefined);
      setCompany(null);
      setErrorMessage("Não foi possível carregar esta página de agendamento.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookedTimes(companyId: string, date: string) {
    try {
      setLoadingTimes(true);

      const data = await getBookedTimesByCompanyAndDate(companyId, date);
      setBookedTimes(data);
    } catch {
      setBookedTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }

  useEffect(() => {
    loadPublicData();
  }, [slug]);

  useEffect(() => {
    setStartTime("");
    setBookedTimes([]);

    if (company && appointmentDate) {
      loadBookedTimes(company.id, appointmentDate);
    }
  }, [company, appointmentDate]);

  useEffect(() => {
    setStartTime("");
  }, [serviceId]);

  const selectedService = services.find((service) => service.id === serviceId);

  const selectedDateDay =
    appointmentDate.length > 0
      ? new Date(`${appointmentDate}T00:00:00`).getDay()
      : null;

  const availabilityForSelectedDay =
    selectedDateDay === null
      ? []
      : availability.filter((rule) => rule.day_of_week === selectedDateDay);

  const availableTimeSlots = useMemo(() => {
    if (!selectedService || availabilityForSelectedDay.length === 0) {
      return [];
    }

    const allSlots = generateTimeSlots(
      availabilityForSelectedDay,
      selectedService.duration_minutes
    );

    return allSlots.filter((slot) => !bookedTimes.includes(slot));
  }, [selectedService, availabilityForSelectedDay, bookedTimes]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company || !selectedService) return;

    if (!appointmentDate) {
      setErrorMessage("Escolha uma data para o agendamento.");
      return;
    }

    if (!startTime) {
      setErrorMessage("Escolha um horário disponível.");
      return;
    }

    if (!availableTimeSlots.includes(startTime)) {
      setErrorMessage("Este horário não está mais disponível.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const endTime = addMinutesToTime(
        startTime,
        selectedService.duration_minutes
      );

      await createPublicAppointment({
        company_id: company.id,
        service_id: selectedService.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        notes,
      });

      setSuccessMessage(
        "Agendamento enviado com sucesso. Aguarde a confirmação."
      );

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setAppointmentDate("");
      setStartTime("");
      setNotes("");
      setBookedTimes([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao criar agendamento."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="zunary-booking-page">
        <div className="zunary-booking-brand">
          <div className="zunary-logo-mark">
            <span>Z</span>
          </div>
          <p>Carregando página de agendamento...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    const message = getPublicBookingErrorMessage(publicErrorReason);

    return (
      <div className="zunary-booking-page">
        <div className="zunary-booking-shell">
          <div className="zunary-booking-brand">
            <div className="zunary-logo-mark">
              <span>Z</span>
            </div>

            <h1>Zunary</h1>
            <p>Agendamentos simples para negócios organizados.</p>
          </div>

          <div className="zunary-booking-card">
            <div className="zunary-card-header">
              <h2>{message.title}</h2>
              <p>{errorMessage || message.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zunary-booking-page">
      <div className="zunary-booking-shell">
        <div className="zunary-booking-brand">
          <div className="zunary-logo-mark">
            <span>Z</span>
          </div>

          <h1>Zunary</h1>
          <p>Agendamentos simples para negócios organizados.</p>
        </div>

        <div className="zunary-booking-card">
          <div className="zunary-booking-company">
            <span>Agendamento online</span>
            <h2>{company.name}</h2>
            {company.description && <p>{company.description}</p>}
          </div>

          {errorMessage && <div className="zunary-error">{errorMessage}</div>}

          {successMessage && (
            <div className="zunary-success">{successMessage}</div>
          )}

          {services.length === 0 ? (
            <div className="zunary-empty-card">
              Esta empresa ainda não possui serviços disponíveis.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="zunary-form">
              <div className="zunary-field">
                <label>Serviço</label>
                <select
                  className="zunary-select"
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  required
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {service.duration_minutes} min —{" "}
                      {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="zunary-form-grid">
                <div className="zunary-field">
                  <label>Data</label>
                  <input
                    className="zunary-input"
                    type="date"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    required
                  />
                </div>

                <div className="zunary-field">
                  <label>Horário disponível</label>
                  <select
                    className="zunary-select"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    disabled={
                      !appointmentDate ||
                      loadingTimes ||
                      availableTimeSlots.length === 0
                    }
                  >
                    <option value="">
                      {!appointmentDate
                        ? "Escolha uma data primeiro"
                        : loadingTimes
                        ? "Carregando horários..."
                        : availableTimeSlots.length === 0
                        ? "Nenhum horário disponível"
                        : "Escolha um horário"}
                    </option>

                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {appointmentDate && (
                <div className="zunary-availability-box">
                  {availabilityForSelectedDay.length > 0 ? (
                    <>
                      <strong>
                        Disponibilidade para{" "}
                        {getDayName(selectedDateDay as number)}:
                      </strong>

                      <ul>
                        {availabilityForSelectedDay.map((rule) => (
                          <li key={rule.id}>
                            {rule.start_time.slice(0, 5)} até{" "}
                            {rule.end_time.slice(0, 5)}
                          </li>
                        ))}
                      </ul>

                      {bookedTimes.length > 0 && (
                        <p style={{ marginTop: 10 }}>
                          Horários ocupados não aparecem na lista.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Não há disponibilidade cadastrada para este dia.</p>
                  )}
                </div>
              )}

              <div className="zunary-field">
                <label>Seu nome</label>
                <input
                  className="zunary-input"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="zunary-form-grid">
                <div className="zunary-field">
                  <label>E-mail</label>
                  <input
                    className="zunary-input"
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="zunary-field">
                  <label>Telefone</label>
                  <input
                    className="zunary-input"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="zunary-field">
                <label>Observações</label>
                <textarea
                  className="zunary-textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Alguma observação para o atendimento?"
                />
              </div>

              <button
                className="zunary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Solicitar agendamento"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}