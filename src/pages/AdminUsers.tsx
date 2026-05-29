import { useEffect, useState } from "react";
import { Search, Shield, Users } from "lucide-react";
import {
  getAdminUsers,
  isCurrentUserAdmin,
  type AdminUser,
} from "../lib/admin";

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getRoleLabel(role?: string | null) {
  if (role === "admin") return "Admin";
  return "Usuário";
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) return;

      const data = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar usuários."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      user.full_name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value) ||
      user.role.toLowerCase().includes(value);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <p className="zunary-muted-text">Carregando usuários...</p>;
  }

  if (!admin) {
    return (
      <div className="zunary-blocked-page">
        <div className="zunary-blocked-icon">
          <Shield size={24} />
        </div>

        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva para usuários admin/master da Zunary.</p>
      </div>
    );
  }

  if (errorMessage) {
    return <div className="zunary-error">{errorMessage}</div>;
  }

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Usuários</h1>
          <p>Veja todos os usuários cadastrados na Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadUsers}
        >
          Atualizar
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail ou role..."
            />
          </div>

          <select
            className="zunary-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="admin">Admins</option>
            <option value="user">Usuários comuns</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="zunary-empty-card">Nenhum usuário encontrado.</div>
        ) : (
          <div className="zunary-admin-list">
            {filteredUsers.map((user) => (
              <div key={user.id} className="zunary-admin-list-item">
                <div>
                  <strong>{user.full_name || "Usuário sem nome"}</strong>

                  <span>{user.email || "Sem e-mail"}</span>

                  <span>
                    Tipo: {getRoleLabel(user.role)} • ID: {user.id}
                  </span>
                </div>

                <div className="zunary-admin-company-actions">
                  <div className="zunary-admin-user-role">
                    <Users size={13} />
                    {getRoleLabel(user.role)}
                  </div>

                  <time>{formatDateTime(user.created_at)}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}