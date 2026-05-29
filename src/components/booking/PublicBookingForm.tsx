import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Scissors } from "lucide-react";
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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(date?: string) {
  if (!date) return "Data não escolhida";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
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

function generateTimeSlots(rules: AvailabilityRule[], durationMinutes: number) {
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

  return Array.from(new Set(slots)).sort();
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
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [publicErrorReason, setPublicErrorReason] =
    useState<PublicBookingStatusReason>();

  async function loadPublicData() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setPublicErrorReason(undefined);
      setConfirmedAppointment(null);

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

  const selectedEndTime =
    selectedService && startTime
      ? addMinutesToTime(startTime, selectedService.duration_minutes)
      : "";

  const canSubmit =
    Boolean(company) &&
    Boolean(selectedService) &&
    Boolean(appointmentDate) &&
    Boolean(startTime) &&
    Boolean(customerName.trim()) &&
    !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company || !selectedService) return;

    if (!appointmentDate) {
      setErrorMessage("Escolha uma data para o agendamento.");
      return;
    }

    if (appointmentDate < getTodayDate()) {
      setErrorMessage("Escolha uma data atual ou futura.");
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
      setConfirmedAppointment(null);

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

      setConfirmedAppointment({
        serviceName: selectedService.name,
        date: appointmentDate,
        startTime,
        endTime,
      });

      setSuccessMessage("Agendamento solicitado com sucesso.");

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
        <div className="zunary-public-minimal-container">
          <div className="zunary-public-minimal-loading">
            Carregando agendamento...
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    const message = getPublicBookingErrorMessage(publicErrorReason);

    return (
      <div className="zunary-booking-page">
        <div className="zunary-public-minimal-container">
          <div className="zunary-public-minimal-card center">
            <CalendarDays size={28} />

            <h1>{message.title}</h1>
            <p>{errorMessage || message.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zunary-booking-page">
      <div className="zunary-public-minimal-container">
        <header className="zunary-public-minimal-header">
          <span>Agendamento online</span>
          <h1>{company.name}</h1>

          {company.description && <p>{company.description}</p>}
        </header>

        {errorMessage && <div className="zunary-error">{errorMessage}</div>}

        {successMessage && confirmedAppointment && (
          <div className="zunary-public-minimal-success">
            <CheckCircle2 size={22} />

            <div>
              <strong>{successMessage}</strong>
              <span>
                {confirmedAppointment.serviceName} •{" "}
                {formatDateLabel(confirmedAppointment.date)} •{" "}
                {confirmedAppointment.startTime} até{" "}
                {confirmedAppointment.endTime}
              </span>
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <div className="zunary-public-minimal-card center">
            <Scissors size={28} />

            <h2>Nenhum serviço disponível</h2>
            <p>Esta empresa ainda não possui serviços ativos.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="zunary-public-minimal-card">
            <section className="zunary-public-minimal-section">
              <div className="zunary-public-minimal-title">
                <span>1</span>
                <strong>Serviço</strong>
              </div>

              <div className="zunary-public-minimal-services">
                {services.map((service) => {
                  const selected = service.id === serviceId;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      className={
                        selected
                          ? "zunary-public-minimal-service selected"
                          : "zunary-public-minimal-service"
                      }
                      onClick={() => setServiceId(service.id)}
                    >
                      <strong>{service.name}</strong>

                      <span>
                        {service.duration_minutes} min •{" "}
                        {formatCurrency(service.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="zunary-public-minimal-section">
              <div className="zunary-public-minimal-title">
                <span>2</span>
                <strong>Data</strong>
              </div>

              <input
                className="zunary-input"
                type="date"
                min={getTodayDate()}
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
                required
              />

              {appointmentDate && (
                <div className="zunary-public-minimal-availability">
                  {availabilityForSelectedDay.length > 0 ? (
                    <>
                      <strong>{getDayName(selectedDateDay as number)}</strong>

                      <span>
                        {availabilityForSelectedDay
                          .map(
                            (rule) =>
                              `${rule.start_time.slice(0, 5)}-${rule.end_time.slice(
                                0,
                                5
                              )}`
                          )
                          .join(" • ")}
                      </span>
                    </>
                  ) : (
                    <span>Sem disponibilidade para este dia.</span>
                  )}
                </div>
              )}
            </section>

            <section className="zunary-public-minimal-section">
              <div className="zunary-public-minimal-title">
                <span>3</span>
                <strong>Horário</strong>
              </div>

              {!appointmentDate ? (
                <div className="zunary-public-minimal-empty">
                  Escolha uma data primeiro.
                </div>
              ) : loadingTimes ? (
                <div className="zunary-public-minimal-empty">
                  Carregando horários...
                </div>
              ) : availableTimeSlots.length === 0 ? (
                <div className="zunary-public-minimal-empty">
                  Nenhum horário disponível.
                </div>
              ) : (
                <div className="zunary-public-minimal-times">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={
                        startTime === slot
                          ? "zunary-public-minimal-time selected"
                          : "zunary-public-minimal-time"
                      }
                      onClick={() => setStartTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="zunary-public-minimal-section">
              <div className="zunary-public-minimal-title">
                <span>4</span>
                <strong>Seus dados</strong>
              </div>

              <div className="zunary-field">
                <label>Nome</label>
                <input
                  className="zunary-input"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="zunary-form-grid">
                <div className="zunary-field">
                  <label>Telefone</label>
                  <input
                    className="zunary-input"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

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
              </div>

              <div className="zunary-field">
                <label>Observações</label>
                <textarea
                  className="zunary-textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </section>

            <div className="zunary-public-minimal-summary">
              <div>
                <span>Resumo</span>

                <strong>
                  {selectedService?.name || "Serviço"} •{" "}
                  {formatDateLabel(appointmentDate)} •{" "}
                  {startTime ? `${startTime} até ${selectedEndTime}` : "Horário"}
                </strong>
              </div>

              <button
                className="zunary-button"
                type="submit"
                disabled={!canSubmit}
              >
                {submitting ? "Enviando..." : "Confirmar agendamento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}