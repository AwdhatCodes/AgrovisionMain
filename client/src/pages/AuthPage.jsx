import React, { useState } from 'react'
import { Sprout, Eye, EyeOff, ArrowRight, User, Mail, Lock } from 'lucide-react'

const AVATAR_COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#34d399']

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer', farmName: '', region: '', lat: '', lng: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locLoading, setLocLoading] = useState(false)
  
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role, farmName: form.farmName, region: form.region, lat: form.lat, lng: form.lng }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      localStorage.setItem('fm_token', data.token)
      localStorage.setItem('fm_user', JSON.stringify(data.user))
      onAuth(data.user)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async (type) => {
    setLoading(true); setError('')
    try {
      const email = type === 'admin' ? 'admin@demo.com' : 'farmer@demo.com'
      const password = 'demo'
      const name = type === 'admin' ? 'Admin User' : 'Farmer User'
      
      // Try login first
      let res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      // If not found, register it
      if (!res.ok) {
        const reqBody = { name, email, password, role: type }
        if (type === 'farmer') {
          reqBody.farmName = 'Demo Farmer Estate'
          reqBody.region = 'Nakuru County'
          reqBody.lat = -0.3031
          reqBody.lng = 36.0800
        }
        res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        })
      }
      
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Demo login failed'); return }
      
      localStorage.setItem('fm_token', data.token)
      localStorage.setItem('fm_user', JSON.stringify(data.user))
      onAuth(data.user)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg1)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(74,222,128,0.12)', border: '1.5px solid rgba(74,222,128,0.35)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Sprout size={28} color="#4ade80" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AgroVision</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Potato disease-aware store</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
            {mode === 'login' ? 'to continue to AgroVision' : 'to join AgroVision'}
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Full name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required style={{ paddingLeft: 40 }} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ marginBottom: 6, display: 'block', fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Account type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['farmer', 'admin'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set('role', type)}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: form.role === type ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: form.role === type ? 'rgba(74,222,128,0.1)' : 'transparent',
                          color: form.role === type ? 'var(--text)' : 'var(--text2)',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {type === 'farmer' ? 'Farmer' : 'Admin'}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                    Choose admin if you want admin access on the platform.
                  </p>
                </div>

                {form.role === 'farmer' && (
                  <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', margin: 0 }}>Farm Details</p>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ marginBottom: 6, display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Farm Name</label>
                      <input value={form.farmName} onChange={e => set('farmName', e.target.value)} placeholder="e.g. Green Acres" required style={{ width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ marginBottom: 6, display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Region / County</label>
                      <input value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Nakuru County" required style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ marginBottom: 6, display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Latitude</label>
                        <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="-0.3031" required style={{ width: '100%' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ marginBottom: 6, display: 'block', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Longitude</label>
                        <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="36.0800" required style={{ width: '100%' }} />
                      </div>
                    </div>
                    <button type="button" onClick={() => {
                      if ("geolocation" in navigator) {
                        setLocLoading(true)
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            set('lat', pos.coords.latitude);
                            set('lng', pos.coords.longitude);
                            setLocLoading(false);
                          },
                          err => {
                            setLocLoading(false);
                            alert("Could not fetch location: " + err.message + ". Please check your device location permissions.");
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      } else {
                        alert("Geolocation is not supported by your browser.");
                      }
                    }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {locLoading ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div> : '📍'} Use Current Location
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ marginBottom: 6, display: 'block', fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ marginBottom: 6, display: 'block', fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Your password'} required style={{ paddingLeft: 40, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>



            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '13px 20px', fontSize: 15, fontWeight: 600, marginTop: 4, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><span>{mode === 'login' ? 'Sign in' : 'Create account'}</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button onClick={() => {}} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Demo accounts hint */}
        <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Fast login — tap to continue instantly</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button type="button" onClick={() => handleDemo('farmer')} disabled={loading} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 16px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🌿 Farmer</button>
            <button type="button" onClick={() => handleDemo('admin')} disabled={loading} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 16px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>⚙️ Admin</button>
          </div>
        </div>
      </div>
    </div>
  )
}
