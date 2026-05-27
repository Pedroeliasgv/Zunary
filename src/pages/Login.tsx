import { LoginForm } from "../components/auth/LoginForm";

export function Login() {
  return (
    <div className="zunary-auth-page">
      <div className="zunary-auth-shell">
        <LoginForm />
      </div>
    </div>
  );
}