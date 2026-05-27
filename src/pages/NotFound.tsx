import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="zunary-auth-page">
      <div className="zunary-auth-shell">
        <div className="zunary-auth-card">
          <div className="zunary-logo-mark">
            <span>Z</span>
          </div>

          <h1 className="zunary-auth-title">Página não encontrada</h1>

          <p className="zunary-auth-subtitle">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>

          <div style={{ marginTop: 24 }}>
            <Link to="/dashboard" className="zunary-button">
              Voltar para o dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}