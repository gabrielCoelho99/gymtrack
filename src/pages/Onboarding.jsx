import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateWorkoutRoutine } from '../lib/gemini';

export default function Onboarding() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    weight: profile?.weight || '',
    height: profile?.height || '',
    age: '',
    gender: 'Masculino',
    goal: 'Perder peso e ganhar massa',
    experience_level: 'Iniciante (Nunca treinei ou parei faz muito tempo)',
    training_days_per_week: 3,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Chamar a IA (Gemini)
      const aiRoutine = await generateWorkoutRoutine(formData);

      // 2. Salvar no Supabase
      const updates = {
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        goal: formData.goal,
        experience_level: formData.experience_level,
        training_days_per_week: parseInt(formData.training_days_per_week),
        ai_routine: aiRoutine,
        onboarding_completed: true,
      };

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 3. Atualizar contexto e redirecionar
      setProfile({ ...profile, ...updates });
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao gerar seu treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--spacing-lg)' }}>
      <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', marginTop: 'var(--spacing-xl)' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-xs)' }}>Bem-vindo ao GymTrack</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Vamos montar o treino perfeito para você</p>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-xl)', justifyContent: 'center' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ 
              height: '4px', 
              width: '40px', 
              backgroundColor: i <= step ? 'var(--primary)' : 'var(--bg-tertiary)',
              borderRadius: '2px',
              transition: 'background-color 0.3s'
            }} />
          ))}
        </div>
      </header>

      {error && (
        <div className="error-message" style={{ marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: 'var(--spacing-md)' }} />
          <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>A Inteligência Artificial está trabalhando...</h3>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Analizando seu perfil e criando sua rotina personalizada A/B/C exclusiva.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* STEP 1: Medidas */}
          {step === 1 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <h2>Suas Medidas</h2>
              
              <div className="input-group">
                <label>Peso atual (kg)</label>
                <input 
                  type="number" 
                  name="weight" 
                  value={formData.weight} 
                  onChange={handleChange} 
                  placeholder="Ex: 80"
                  required
                  step="0.1"
                  min="30"
                />
              </div>

              <div className="input-group">
                <label>Altura (m)</label>
                <input 
                  type="number" 
                  name="height" 
                  value={formData.height} 
                  onChange={handleChange} 
                  placeholder="Ex: 1.75"
                  required
                  step="0.01"
                  min="1"
                />
              </div>

              <div className="input-group">
                <label>Idade (anos)</label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleChange} 
                  placeholder="Ex: 25"
                  required
                  min="12"
                />
              </div>

              <div className="input-group">
                <label>Gênero</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!formData.weight || !formData.height || !formData.age}>
                Próximo
              </button>
            </div>
          )}

          {/* STEP 2: Objetivo */}
          {step === 2 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <h2>Seu Objetivo Principal</h2>
              
              <div className="input-group">
                <label>O que você deseja alcançar?</label>
                <select name="goal" value={formData.goal} onChange={handleChange}>
                  <option value="Perder peso (Emagrecimento focado)">Perder peso (Emagrecimento focado)</option>
                  <option value="Perder peso e ganhar força">Perder peso e ganhar força</option>
                  <option value="Ganhar massa muscular (Hipertrofia)">Ganhar massa muscular (Hipertrofia)</option>
                  <option value="Definição muscular">Definição muscular</option>
                  <option value="Condicionamento físico geral">Condicionamento geral e saúde</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'auto' }}>
                <button type="button" className="btn btn-outline" onClick={handleBack} style={{ flex: 1 }}>
                  Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ flex: 2 }}>
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Experiência */}
          {step === 3 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <h2>Sua Experiência</h2>
              
              <div className="input-group">
                <label>Qual seu nível atual?</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange}>
                  <option value="Iniciante nunca treinou">Iniciante (Nunca treinei)</option>
                  <option value="Iniciante (Já treinei no passado mas parei faz tempo)">Iniciante (Já treinei no passado mas parei faz tempo)</option>
                  <option value="Intermediário (Treino a alguns meses)">Intermediário (Treino a alguns meses)</option>
                  <option value="Avançado (Treino a mais de 1 ano focado)">Avançado (Treino a mais de 1 ano focado)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'auto' }}>
                <button type="button" className="btn btn-outline" onClick={handleBack} style={{ flex: 1 }}>
                  Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ flex: 2 }}>
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Dias de Treino */}
          {step === 4 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <h2>Disponibilidade</h2>
              
              <div className="input-group">
                <label>Quantos dias por semana você tem para MUSCULAÇÃO?</label>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginTop: '-8px', marginBottom: '8px' }}>
                  A IA dividirá seu treino baseado nisso (ex: 3 dias = ABC, 4 dias = ABCD)
                </p>
                <select name="training_days_per_week" value={formData.training_days_per_week} onChange={handleChange}>
                  <option value={2}>2 dias por semana</option>
                  <option value={3}>3 dias por semana</option>
                  <option value={4}>4 dias por semana</option>
                  <option value={5}>5 dias por semana</option>
                  <option value={6}>6 dias por semana</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'auto' }}>
                <button type="button" className="btn btn-outline" onClick={handleBack} style={{ flex: 1 }}>
                  Voltar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Gerar Meu Treino ✨
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
