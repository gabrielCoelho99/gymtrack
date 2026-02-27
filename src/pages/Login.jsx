import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">🏋️</div>
        <h1 className="auth-title">
          Gym<span className="auth-accent">Track</span>
        </h1>
        <p className="auth-tagline">Sua rotina de treinos personalizada</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              className="form-input"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            className="form-input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <div className="auth-toggle">
        {isSignUp ? 'Já tem conta? ' : 'Não tem conta? '}
        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
          {isSignUp ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
