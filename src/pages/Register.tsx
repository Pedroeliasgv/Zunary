import { RegisterForm } from "../components/auth/RegisterForm";

export function Register() {
  return (
    <div className="zunary-auth-page">
      <div className="zunary-auth-shell">
        <RegisterForm />
      </div>
    </div>
  );
}