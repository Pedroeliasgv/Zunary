import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  Home,
  Scissors,
  ClipboardList,
  Settings,
  Shield,
  Receipt,
  Activity,
  Users,
} from "lucide-react";
import { isCurrentUserAdmin } from "../../lib/admin";

const baseItems = [
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
    label: "Planos",
    href: "/plans",
    icon: CreditCard,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Empresas",
    href: "/admin/companies",
    icon: Building2,
    adminOnly: true,
  },
  {
    label: "Assinaturas",
    href: "/admin/subscriptions",
    icon: Receipt,
    adminOnly: true,
  },
  {
    label: "Eventos",
    href: "/admin/events",
    icon: Activity,
    adminOnly: true,
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
  },

];

const adminItem = {
  label: "Admin",
  href: "/admin",
  icon: Shield,
};

export function DashboardSidebar() {
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadAdminStatus() {
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);
    }

    loadAdminStatus();
  }, []);

  const items = useMemo(() => {
    if (isAdmin) {
      return [...baseItems, adminItem];
    }

    return baseItems;
  }, [isAdmin]);

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

      {isAdmin ? (
        <div className="zunary-sidebar-box">
          <p>Modo admin</p>
          <span>
            Você está usando uma conta master para testes internos da Zunary.
          </span>
        </div>
      ) : (
        <div className="zunary-sidebar-box">
          <p>MVP Zunary</p>
          <span>
            Organize serviços, horários e agendamentos em um só lugar.
          </span>
        </div>
      )}
    </aside>
  );
}