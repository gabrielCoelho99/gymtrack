import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { workouts } from '../data/workouts';

export default function Workout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Obter treino da IA se existir, senão fallback estático
  const aiWorkoutsArray = profile?.ai_routine?.workouts || [];
  const aiWorkout = aiWorkoutsArray.find(w => w.workout_type === id);
  
  let workout = workouts[id];
  if (aiWorkout) {
    const colors = ['#00ff88', '#ffaa00', '#ff0055', '#bb00ff', '#00d4ff', '#ffeb3b'];
    const idx = aiWorkoutsArray.findIndex(w => w.workout_type === id);
    workout = {
      id: aiWorkout.workout_type,
      name: `Treino ${aiWorkout.workout_type}`,
      subtitle: aiWorkout.name,
      color: colors[idx % colors.length],
      icon: '🏋️',
      exercises: aiWorkout.exercises.map((ex, j) => ({
        id: `${aiWorkout.workout_type}-${j}`,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        muscle: 'Variado'
      }))
    };
  }

  const [exerciseStates, setExerciseStates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [workoutStarted, setWorkoutStarted] = useState(false);

  useEffect(() => {
    if (!workout) return;
    setExerciseStates(
      workout.exercises.map((ex) => ({
        name: ex.name,
        completed: false,
        weight: '',
      }))
    );
  }, [id]);

  if (!workout) {
    return (
      <div className="page">
        <p>Treino não encontrado.</p>
        <button className="back-btn" onClick={() => navigate('/')}>← Voltar</button>
      </div>
    );
  }

  const toggleExercise = (index) => {
    setExerciseStates((prev) =>
      prev.map((ex, i) =>
        i === index ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };

  const updateWeight = (index, weight) => {
    setExerciseStates((prev) =>
      prev.map((ex, i) =>
        i === index ? { ...ex, weight } : ex
      )
    );
  };

  const completedCount = exerciseStates.filter((e) => e.completed).length;
  const totalCount = exerciseStates.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const saveWorkout = async () => {
    if (completedCount === 0) return;
    setSaving(true);

    try {
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_type: id,
          duration_minutes: null,
          notes: `${completedCount}/${totalCount} exercícios completos`,
        })
        .select()
        .single();

      if (logError) throw logError;

      const exerciseLogs = exerciseStates
        .filter((ex) => ex.completed)
        .map((ex) => {
          const exerciseData = workout.exercises.find((e) => e.name === ex.name);
          return {
            workout_log_id: logData.id,
            exercise_name: ex.name,
            sets_completed: exerciseData?.sets || 0,
            reps: exerciseData?.reps || '',
            weight_kg: ex.weight ? parseFloat(ex.weight) : null,
            completed: true,
          };
        });

      if (exerciseLogs.length > 0) {
        const { error: exError } = await supabase
          .from('exercise_logs')
          .insert(exerciseLogs);
        if (exError) throw exError;
      }

      setToast('Treino salvo com sucesso! 💪');
      setTimeout(() => {
        setToast('');
        navigate('/');
      }, 1500);
    } catch (err) {
      setToast('Erro ao salvar: ' + err.message);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page fade-in">
      {toast && <div className="toast">{toast}</div>}

      <button className="back-btn" onClick={() => navigate('/')}>← Voltar</button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: '1.75rem' }}>{workout.icon}</span>
          <div>
            <h1 className="page-title">{workout.name}</h1>
            <p className="page-subtitle">{workout.subtitle}</p>
          </div>
        </div>
      </div>

      {!workoutStarted ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>{workout.icon}</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--fs-sm)' }}>
            {workout.exercises.length} exercícios · ~{workout.exercises.length * 5} min estimados
          </p>
          <button
            className="start-workout-btn"
            onClick={() => setWorkoutStarted(true)}
          >
            🚀 Iniciar Treino
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                {completedCount}/{totalCount} exercícios
              </span>
              <span className="summary-badge success">{progress}%</span>
            </div>
            <div style={{
              height: '6px',
              background: 'var(--border)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                borderRadius: '3px',
                transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>

          {/* Exercise List */}
          <div className="exercise-list">
            {workout.exercises.map((ex, i) => (
              <div
                key={ex.name}
                className={`exercise-item ${exerciseStates[i]?.completed ? 'completed' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <button
                  className={`exercise-checkbox ${exerciseStates[i]?.completed ? 'checked' : ''}`}
                  onClick={() => toggleExercise(i)}
                >
                  {exerciseStates[i]?.completed ? '✓' : ''}
                </button>

                <div className="exercise-info">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-details">
                    {ex.sets}x{ex.reps} · Descanso: {ex.rest}
                  </div>
                  <div className="exercise-muscle">{ex.muscle}</div>
                </div>

                <input
                  className="exercise-weight-input"
                  type="number"
                  placeholder="kg"
                  value={exerciseStates[i]?.weight || ''}
                  onChange={(e) => updateWeight(i, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <button
              className="btn btn-primary btn-full"
              onClick={saveWorkout}
              disabled={completedCount === 0 || saving}
            >
              {saving ? 'Salvando...' : `✅ Finalizar Treino (${completedCount}/${totalCount})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
