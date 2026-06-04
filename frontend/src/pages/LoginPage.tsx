import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { LoginFormSchema } from '@/utils/validators';
import { loginFormSchema } from '@/utils/validators';
import styles from './LoginPage.module.css';

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
    <main className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Retailr Login</h1>
        {serverError && <p className={styles.serverError} role="alert">{serverError}</p>}
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </label>
        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
          {errors.password && <span className={styles.error}>{errors.password}</span>}
        </label>
        <button type="submit" className={styles.submit} disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
