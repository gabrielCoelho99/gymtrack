import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cardioPhases } from '../data/cardio';

export default function Cardio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const { data } = await supabase
        .from('cardio_progress')
        .select('current_week')
        .eq('user_id', user.id)
        .single();

      if (data) setCurrentWeek(data.current_week);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const advanceWeek = async () => {
    if (currentWeek >= 12) return;

    const newWeek = currentWeek + 1;

    const { error } = await supabase
      .from('cardio_progress')
      .upsert({
        user_id: user.id,
        current_week: newWeek,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      setCurrentWeek(newWeek);
      setToast(`Semana ${newWeek} desbloqueada! 🎉`);
      setTimeout(() => setToast(''), 2000);
    }
  };

  const logCardioSession = async () => {
    await supabase.from('workout_logs').insert({
      user_id: user.id,
      workout_type: 'cardio',
      notes: `Semana ${currentWeek} - Cardio completo`,
    });

    setToast('Cardio registrado! 🏃');
    setTimeout(() => setToast(''), 2000);
  };

  const getPhaseStatus = (phase) => {
    if (currentWeek > phase.weekEnd) return 'done';
    if (currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd) return 'active';
    return 'locked';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const currentPhase = cardioPhases.find(
    (p) => currentWeek >= p.weekStart && currentWeek <= p.weekEnd
  );

  return (
    <div className="page fade-in">
      {toast && <div className="toast">{toast}</div>}

      <button className="back-btn" onClick={() => navigate('/')}>← Voltar</button>

      <div className="page-header">
        <h1 className="page-title">🏃 Cardio Progressivo</h1>
        <p className="page-subtitle">
          Semana {currentWeek} de 12 · {currentPhase?.phase || 'Finalizado'}
        </p>
      </div>

      {/* Current Phase Highlight */}
      {currentPhase && (
        <div className="card" style={{
          marginBottom: 'var(--space-lg)',
          borderColor: currentPhase.color,
          background: `${currentPhase.color}08`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--fs-lg)', color: currentPhase.color }}>
              📍 Fase Atual: {currentPhase.phase}
            </span>
            <span style={{
              fontSize: 'var(--fs-xs)',
              background: `${currentPhase.color}20`,
              color: currentPhase.color,
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
            }}>
              {currentPhase.totalDuration}
            </span>
          </div>

          <div className="cardio-blocks">
            {currentPhase.blocks.map((block, i) => (
              <div className="cardio-block" key={i}>
                <span>{block.activity}</span>
                <span style={{ fontWeight: 600 }}>{block.duration}</span>
              </div>
            ))}
          </div>

          {currentPhase.repeat && (
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              🔁 Repetir {currentPhase.repeat}x
            </p>
          )}

          <p className="cardio-tip">💡 {currentPhase.tip}</p>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={logCardioSession}>
              ✅ Registrar Sessão
            </button>
            <button
              className="cardio-advance-btn"
              style={{ flex: 1 }}
              onClick={advanceWeek}
              disabled={currentWeek >= 12}
            >
              ⏭️ Avançar Semana
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="section">
        <h2 className="section-title">Linha do Tempo</h2>
        <div className="cardio-timeline">
          {cardioPhases.map((phase) => {
            const status = getPhaseStatus(phase);
            return (
              <div
                key={phase.phase}
                className={`cardio-phase ${status}`}
                style={status === 'active' ? { borderColor: phase.color } : {}}
              >
                <div className="cardio-phase-header">
                  <span className="cardio-phase-name" style={status === 'active' ? { color: phase.color } : {}}>
                    {status === 'done' ? '✅ ' : status === 'active' ? '📍 ' : '🔒 '}
                    {phase.phase}
                  </span>
                  <span className="cardio-phase-weeks">Semanas {phase.weeks}</span>
                </div>

                <div className="cardio-blocks">
                  {phase.blocks.map((block, i) => (
                    <div className="cardio-block" key={i}>
                      <span>{block.activity}</span>
                      <span style={{ fontWeight: 600 }}>{block.duration}</span>
                    </div>
                  ))}
                </div>

                {phase.repeat && (
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                    🔁 Repetir {phase.repeat}x · Total: {phase.totalDuration}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
