import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalCardio: 0, currentWeek: 1 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', weight: '', height: '' });

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setForm({
          display_name: profileData.display_name || '',
          weight: profileData.weight?.toString() || '',
          height: profileData.height?.toString() || '',
        });
      }

      const { count: workoutCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('workout_type', 'cardio');

      const { count: cardioCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('workout_type', 'cardio');

      const { data: cardioData } = await supabase
        .from('cardio_progress')
        .select('current_week')
        .eq('user_id', user.id)
        .single();

      setStats({
        totalWorkouts: workoutCount || 0,
        totalCardio: cardioCount || 0,
        currentWeek: cardioData?.current_week || 1,
      });
    };

    fetchAll();
  }, [user]);

  const saveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name,
        weight: parseFloat(form.weight) || null,
        height: parseFloat(form.height) || null,
      })
      .eq('id', user.id);

    if (!error) {
      setProfile({ ...profile, ...form, weight: parseFloat(form.weight), height: parseFloat(form.height) });
      setEditing(false);
    }
  };

  const bmi = profile?.weight && profile?.height
    ? (profile.weight / (profile.height * profile.height)).toFixed(1)
    : '—';

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Perfil</h1>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">🏋️</div>
        <div className="profile-name">{profile?.display_name || 'Atleta'}</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginTop: 'var(--space-xs)' }}>
          {user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-value">{stats.totalWorkouts}</div>
          <div className="stat-label">Treinos</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalCardio}</div>
          <div className="stat-label">Cardios</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.currentWeek}/12</div>
          <div className="stat-label">Semana</div>
        </div>
      </div>

      {/* Body Info */}
      <div className="section" style={{ marginTop: 'var(--space-lg)' }}>
        <h2 className="section-title">Informações Corporais</h2>
        <div className="card">
          {editing ? (
            <>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Altura (m)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProfile}>
                  Salvar
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{profile?.weight || '—'}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{profile?.height || '—'}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>m</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{bmi}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>IMC</div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: 'var(--space-md)' }}
                onClick={() => setEditing(true)}
              >
                ✏️ Editar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Goal */}
      <div className="section">
        <h2 className="section-title">Objetivo e Perfil</h2>
        <div className="card">
          <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, marginBottom: 'var(--spacing-sm)' }}>
            🎯 <strong>Objetivo:</strong> {profile?.goal || 'Não definido'}
          </p>
          <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
            💪 <strong>Experiência:</strong> {profile?.experience_level || 'Não definido'}
          </p>
        </div>
      </div>

      <button 
        className="btn btn-primary btn-full" 
        style={{ marginTop: 'var(--space-md)' }}
        onClick={() => {
          // O usuário quer refazer a rotina, joga pro onboarding
          window.location.href = '/onboarding';
        }}
      >
        ✨ Refazer Rotina com IA
      </button>

      {/* Logout */}
      <button className="btn btn-danger btn-full" onClick={signOut} style={{ marginTop: 'var(--space-md)' }}>
        Sair da conta
      </button>
    </div>
  );
}
