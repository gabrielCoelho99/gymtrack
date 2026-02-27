import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { weekSchedule as defaultWeekSchedule, workouts as defaultWorkouts } from '../data/workouts';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);

  // Se o usuário já tiver recebido uma rotina da IA, usamos ela. Caso contrário faz fallback.
  // Transformar Array de workouts em Objeto para compatibilidade:
  const aiWorkoutsArray = profile?.ai_routine?.workouts || [];
  const hasAiRoutine = aiWorkoutsArray.length > 0;
  
  const workouts = hasAiRoutine 
    ? aiWorkoutsArray.reduce((acc, w, i) => {
        // Cores hex para cada tipo de treino
        const colors = ['#00ff88', '#ffaa00', '#ff0055', '#bb00ff', '#00d4ff', '#ffeb3b'];
        acc[w.workout_type] = {
          id: w.workout_type,
          name: `Treino ${w.workout_type}`,
          subtitle: w.name,
          color: colors[i % colors.length],
          icon: '🏋️',
          exercises: w.exercises.map((ex, j) => ({
            id: `${w.workout_type}-${j}`,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            muscleGroup: 'Variado'
          }))
        };
        return acc;
      }, {})
    : defaultWorkouts;

  // Gerar o schedule dinamicamente baseado na quantidade de dias selecionada
  let weekSchedule = defaultWeekSchedule;
  if (hasAiRoutine) {
    const types = Object.keys(workouts);
    weekSchedule = [
      { day: 'Segunda', type: 'strength', workoutId: types[0] || 'A', label: `Treino ${types[0] || 'A'}` },
      { day: 'Terça', type: 'cardio', label: 'Cardio' },
      { day: 'Quarta', type: 'strength', workoutId: types[1] || 'B', label: `Treino ${types[1] || 'B'}` },
      { day: 'Quinta', type: 'cardio', label: 'Cardio' },
      { day: 'Sexta', type: 'strength', workoutId: types[2] || types[0] || 'C', label: `Treino ${types[2] || types[0] || 'C'}` },
      { day: 'Sábado', type: types.length > 3 ? 'strength' : 'rest', workoutId: types[3] || 'A', label: types.length > 3 ? `Treino ${types[3]}` : 'Descanso' },
      { day: 'Domingo', type: 'rest', label: 'Descanso' }
    ];
  }

  const todayIndex = new Date().getDay();
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Sun=6, Mon=0, ...
  const todayScheduleIndex = dayMap[todayIndex];
  const todaySchedule = weekSchedule[todayScheduleIndex];

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startOfWeek.toISOString());

      setWeekLogs(logs || []);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      setTodayLogs((logs || []).filter(l => new Date(l.completed_at) >= todayStart));
    };

    fetchData();
  }, [user]);

  const completedDays = new Set(weekLogs.map(l => l.workout_type));

  const getDayIcon = (item) => {
    if (item.type === 'rest') return '😴';
    if (item.type === 'cardio') return '🏃';
    return workouts[item.workoutId]?.icon || '🏋️';
  };

  const isDayCompleted = (item) => {
    if (item.type === 'rest') return false;
    if (item.type === 'cardio') return completedDays.has('cardio');
    return completedDays.has(item.workoutId);
  };

  const weekCompletions = weekSchedule.filter(
    (s) => s.type !== 'rest' && isDayCompleted(s)
  ).length;
  const weekTotal = weekSchedule.filter((s) => s.type !== 'rest').length;
  const weekProgress = weekTotal > 0 ? Math.round((weekCompletions / weekTotal) * 100) : 0;

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (weekProgress / 100) * circumference;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="page-subtitle">Olá, {profile?.display_name || 'Atleta'} 👋</p>
        <h1 className="page-title">Dashboard</h1>
      </div>

      {hasAiRoutine && profile?.goal && (
        <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            🎯 {profile.goal}
          </span>
          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            ✨ Plano gerado por Inteligência Artificial
          </span>
        </div>
      )}

      {/* Progress Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
        <div className="progress-ring-container">
          <div className="progress-ring">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
              <circle
                className="progress-ring-fill"
                cx="50" cy="50" r="42"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <span className="progress-ring-text">{weekProgress}%</span>
          </div>
          <span className="progress-ring-label">Progresso semanal</span>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="section">
        <h2 className="section-title">Esta Semana</h2>
        <div className="week-calendar">
          {weekSchedule.map((item, i) => (
            <div
              key={item.day}
              className={`week-day ${i === todayScheduleIndex ? 'today' : ''} ${isDayCompleted(item) ? 'completed' : ''}`}
              onClick={() => {
                if (item.type === 'strength') navigate(`/workout/${item.workoutId}`);
                if (item.type === 'cardio') navigate('/cardio');
              }}
            >
              <span className="week-day-name">{item.day.slice(0, 3)}</span>
              <span className="week-day-icon">
                {isDayCompleted(item) ? '✅' : getDayIcon(item)}
              </span>
              <span className="week-day-type">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="section">
        <h2 className="section-title">Treino de Hoje</h2>
        {todaySchedule.type === 'rest' ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>😴</div>
            <p style={{ fontWeight: 600 }}>Dia de Descanso</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginTop: 'var(--space-xs)' }}>
              Recupere-se para o próximo treino!
            </p>
          </div>
        ) : todaySchedule.type === 'cardio' ? (
          <div
            className="card card-clickable workout-card"
            onClick={() => navigate('/cardio')}
          >
            <div className="workout-card-icon" style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
              🏃
            </div>
            <div className="workout-card-content">
              <div className="workout-card-title">Cardio</div>
              <div className="workout-card-sub">Caminhada / Corrida</div>
            </div>
            <span className="workout-card-arrow">→</span>
          </div>
        ) : (
          <div
            className="card card-clickable workout-card"
            onClick={() => navigate(`/workout/${todaySchedule.workoutId}`)}
          >
            <div
              className="workout-card-icon"
              style={{ background: `${workouts[todaySchedule.workoutId]?.color}15` }}
            >
              {workouts[todaySchedule.workoutId]?.icon}
            </div>
            <div className="workout-card-content">
              <div className="workout-card-title">{workouts[todaySchedule.workoutId]?.name}</div>
              <div className="workout-card-sub">{workouts[todaySchedule.workoutId]?.subtitle}</div>
            </div>
            <span className="workout-card-arrow">→</span>
          </div>
        )}
      </div>

      {/* All Workouts */}
      <div className="section">
        <h2 className="section-title">Todos os Treinos da Sua Rotina</h2>
        {Object.values(workouts).map((w) => (
          <div
            key={w.id}
            className="card card-clickable workout-card"
            onClick={() => navigate(`/workout/${w.id}`)}
          >
            <div className="workout-card-icon" style={{ background: `${w.color}15` }}>
              {w.icon}
            </div>
            <div className="workout-card-content">
              <div className="workout-card-title">{w.name}</div>
              <div className="workout-card-sub">{w.subtitle}</div>
            </div>
            <span className="workout-card-arrow">→</span>
          </div>
        ))}

        {profile?.ai_routine?.cardio_recommendation && (
          <div className="card" style={{ marginTop: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--primary)' }}>
            <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dica do Instrutor (IA):</h3>
            <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>{profile.ai_routine.cardio_recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
