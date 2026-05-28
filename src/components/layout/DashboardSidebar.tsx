import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Home,
  Scissors,
  ClipboardList,
  Settings,
  CreditCard,
  Shield,
} from "lucide-react";

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Serviços",
    href: "/services",
    icon: Scissors,
  },
  {
    label: "Disponibilidade",
    href: "/availability",
    icon: Clock,
  },
  {
    label: "Agendamentos",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Planos",
    href: "/plans",
    icon: CreditCard,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Shield,
  }
];

export function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="zunary-sidebar">
      <div className="zunary-sidebar-brand">
        <div className="zunary-sidebar-logo">
          <ClipboardList size={22} />
        </div>

        <div>
          <strong>Zunary</strong>
          <span>Agendamentos simples</span>
        </div>
      </div>

      <nav className="zunary-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={active ? "active" : ""}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="zunary-sidebar-box">
        <p>MVP Zunary</p>
        <span>
          Organize serviços, horários e agendamentos em um só lugar.
        </span>
      </div>
    </aside>
  );
}