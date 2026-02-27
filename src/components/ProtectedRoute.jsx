import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Carregando...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Se a rota exige onboarding e o usuário ainda não completou
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Se o usuário já completou o onboarding e tenta acessar a tela de onboarding, joga pro dashboard
  if (!requireOnboarding && profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
