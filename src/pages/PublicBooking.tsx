import { useParams } from "react-router-dom";
import { PublicBookingForm } from "../components/booking/PublicBookingForm";

export function PublicBooking() {
  const { slug } = useParams();

  if (!slug) {
    return (
      <div className="zunary-booking-page">
        <div className="zunary-booking-shell">
          <div className="zunary-booking-card">
            <div className="zunary-card-header">
              <h2>Link inválido</h2>
              <p>Verifique se o endereço de agendamento está correto.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <PublicBookingForm slug={slug} />;
}