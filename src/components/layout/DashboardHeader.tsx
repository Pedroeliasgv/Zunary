import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { signOut } from "../../lib/auth";

export function DashboardHeader() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="zunary-header">
      <div>
        <p>Painel da Zunary</p>
        <span>Agendamentos simples para negócios organizados.</span>
      </div>

      <button onClick={handleLogout} className="zunary-header-button">
        <LogOut size={16} />
        Sair
      </button>
    </header>
  );
}