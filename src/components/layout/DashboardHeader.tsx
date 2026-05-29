import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "../../lib/auth";

type DashboardHeaderProps = {
  onOpenMenu?: () => void;
};

export function DashboardHeader({ onOpenMenu }: DashboardHeaderProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="zunary-header">
      <div className="zunary-header-left">
        <button
          className="zunary-mobile-menu-button"
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <p>Painel da Zunary</p>
          <span>Agendamentos simples para negócios organizados.</span>
        </div>
      </div>

      <button onClick={handleLogout} className="zunary-header-button">
        <LogOut size={16} />
        Sair
      </button>
    </header>
  );
}