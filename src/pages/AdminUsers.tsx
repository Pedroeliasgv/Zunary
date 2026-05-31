import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import {
  adminUpdateUserRole,
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

function getRoleClass(role?: string | null) {
  if (role === "admin") return "admin";
  return "user";
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const adminStatus = await isCurrentUserAdmin();
      setAdmin(adminStatus);

      if (!adminStatus) {
        setUsers([]);
        return;
      }

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

  async function handleToggleRole(user: AdminUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";

    const confirmed = window.confirm(
      `Tem certeza que deseja alterar ${
        user.email || "este usuário"
      } para ${getRoleLabel(nextRole)}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setErrorMessage("");
      setSuccessMessage("");

      await adminUpdateUserRole(user.id, nextRole);

      setSuccessMessage(
        `${user.email || "Usuário"} alterado para ${getRoleLabel(
          nextRole
        )} com sucesso.`
      );

      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao alterar tipo de usuário."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  const summary = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      commonUsers: users.filter((user) => user.role !== "admin").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        user.full_name?.toLowerCase().includes(value) ||
        user.email?.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value) ||
        user.id.toLowerCase().includes(value);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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

  return (
    <div className="zunary-page">
      <div className="zunary-page-header">
        <div>
          <span>Admin</span>
          <h1>Usuários</h1>
          <p>Gerencie usuários comuns e contas admin/master da Zunary.</p>
        </div>

        <button
          className="zunary-button zunary-button-secondary"
          onClick={loadUsers}
          disabled={Boolean(updatingUserId)}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {errorMessage && <div className="zunary-error">{errorMessage}</div>}

      {successMessage && (
        <div className="zunary-success">{successMessage}</div>
      )}

      <div className="zunary-admin-users-overview">
        <button
          className={roleFilter === "all" ? "active" : ""}
          type="button"
          onClick={() => setRoleFilter("all")}
        >
          <Users size={20} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </button>

        <button
          className={roleFilter === "admin" ? "active" : ""}
          type="button"
          onClick={() => setRoleFilter("admin")}
        >
          <ShieldCheck size={20} />
          <span>Admins</span>
          <strong>{summary.admins}</strong>
        </button>

        <button
          className={roleFilter === "user" ? "active" : ""}
          type="button"
          onClick={() => setRoleFilter("user")}
        >
          <User size={20} />
          <span>Usuários comuns</span>
          <strong>{summary.commonUsers}</strong>
        </button>
      </div>

      <div className="zunary-card">
        <div className="zunary-card-header">
          <h2>Lista de usuários</h2>
          <p>Busque por nome, e-mail, role ou ID do usuário.</p>
        </div>

        <div className="zunary-admin-toolbar">
          <div className="zunary-search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail, role ou ID..."
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
          <div className="zunary-admin-users-list">
            {filteredUsers.map((user) => (
              <article key={user.id} className="zunary-admin-user-card">
                <div className="zunary-admin-user-main">
                  <div className="zunary-admin-user-avatar">
                    {user.role === "admin" ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div>
                    <span
                      className={`zunary-admin-user-role-pill ${getRoleClass(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>

                    <h3>{user.full_name || "Usuário sem nome"}</h3>

                    <p>{user.email || "Sem e-mail"}</p>

                    <small>ID: {user.id}</small>
                  </div>
                </div>

                <div className="zunary-admin-user-actions">
                  <time>{formatDateTime(user.created_at)}</time>

                  <button
                    className={
                      user.role === "admin"
                        ? "zunary-button zunary-button-danger"
                        : "zunary-button"
                    }
                    onClick={() => handleToggleRole(user)}
                    disabled={updatingUserId === user.id}
                  >
                    {updatingUserId === user.id
                      ? "Alterando..."
                      : user.role === "admin"
                      ? "Tornar usuário"
                      : "Tornar admin"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}