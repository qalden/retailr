import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { LoginFormSchema } from '@/utils/validators';
import { loginFormSchema } from '@/utils/validators';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } } | undefined)?.from?.pathname ?? '/dashboard';

  const [values, setValues] = useState<LoginFormSchema>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginFormSchema>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = loginFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<LoginFormSchema> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormSchema;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        <h1>Retailr Login</h1>
        {serverError && <p role="alert" style={{ color: 'red' }}>{serverError}</p>}
        <label>
          Email
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          {errors.email && <span style={{ color: 'red', fontSize: 12 }}>{errors.email}</span>}
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
          {errors.password && <span style={{ color: 'red', fontSize: 12 }}>{errors.password}</span>}
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
