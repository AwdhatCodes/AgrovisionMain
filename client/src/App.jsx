import React, { useState, useEffect } from 'react'
import { Sprout, ShoppingBasket, ShieldCheck, Map, Bell, Microscope, LogOut, ChevronDown, ClipboardList, MessageSquare } from 'lucide-react'
import Store from './pages/Store.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import FarmMap from './pages/FarmMap.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DiagnosisPage from './pages/DiagnosisPage.jsx'
import FieldLogPage from './pages/FieldLogPage.jsx'
import AgroBotPage from './pages/AgroBotPage.jsx'

const NAV = [
  { id: 'market', label: 'Store', icon: ShoppingBasket },
  { id: 'map', label: 'Farm Map', icon: Map },
  { id: 'scan', label: 'AI Scan', icon: Microscope },
  { id: 'fieldlog', label: 'Field Log', icon: ClipboardList },
  { id: 'agrobot', label: 'Agro-Bot', icon: MessageSquare },
  { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, roles: ['admin'] },
]

function UserMenu({ user, onLogout }) {
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: user.avatar_color || '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0a1a0f', flexShrink: 0 }}>
          {initials}
        </div>
        <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize', lineHeight: 1 }}>{user.role}</span>
        </div>
      </div>
      <button onClick={onLogout} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)', borderRadius: '50%', border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)' }} title="Sign out">
        <LogOut size={16} />
      </button>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [page, setPage] = useState('market')
  const [alerts, setAlerts] = useState([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [seenCount, setSeenCount] = useState(0)
  const [adminPanelAction, setAdminPanelAction] = useState(null)
  const [predictedDisease, setPredictedDisease] = useState(null)

  const normalizedRole = user?.role?.toString().toLowerCase()
  const isAdmin = normalizedRole === 'admin'
  const openAdminAddProduct = () => {
    setAdminPanelAction({ type: 'add-product' })
    setPage('admin')
  }
  const openAdminEditProduct = (product) => {
    setAdminPanelAction({ type: 'edit-product', product })
    setPage('admin')
  }

  useEffect(() => {
    const token = localStorage.getItem('fm_token')
    const stored = localStorage.getItem('fm_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(u => { if (u) setUser(u); else logout() })
          .catch(() => {})
      } catch { logout() }
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!user) return
    const load = () => fetch('/api/alerts').then(r => r.json()).then(data => {
      setAlerts(Array.isArray(data) ? data : [])
    }).catch(() => setAlerts([]))
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [user])

  // Automatically request GPS coordinates when a farmer logs in and doesn't have a location set
  useEffect(() => {
    if (!user) return;
    const normalizedRole = user?.role?.toString().toLowerCase();
    
    // Only prompt if they aren't admin and haven't set their location
    if (normalizedRole !== 'admin' && !user.location?.lat && !user.buyer_lat) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const targetId = user.farm_id || user.id;
            
            // Save to backend
            await fetch(`/api/farms/${targetId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                lat: latitude, 
                lng: longitude,
                name: user.name ? `${user.name}'s Farm` : 'My Farm'
              })
            });
            
            // Update local user state
            const updatedUser = {
              ...user,
              location: { ...user.location, lat: latitude, lng: longitude }
            };
            setUser(updatedUser);
            localStorage.setItem('fm_user', JSON.stringify(updatedUser));
            
            // Tell map to refresh markers
            window.dispatchEvent(new CustomEvent('farms:reload'));
          } catch (err) {
            console.error('Auto GPS update failed', err);
          }
        }, (err) => {
          console.warn('Auto GPS denied or unavailable', err);
        }, { enableHighAccuracy: true, timeout: 20000 });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return
    const navItem = NAV.find(n => n.id === page)
    if (navItem?.roles && !navItem.roles.includes(normalizedRole)) setPage('market')
  }, [normalizedRole, page])

  const PAGE_TITLES = {
    market: 'Store',
    map: 'Farm Map',
    scan: 'AI Scan',
    fieldlog: 'Field Log',
    agrobot: 'Agro-Bot',
    seller: 'Seller Dashboard',
    admin: 'Admin Panel',
  }

  useEffect(() => {
    if (!user) {
      document.title = 'AgroVision — Sign in'
      return
    }
    document.title = `AgroVision — ${PAGE_TITLES[page] || 'AgroVision'}`
  }, [user, page])

  const handleAuth = (u) => {
    setUser(u)
    const role = u?.role?.toString().toLowerCase()
    setPage(role === 'admin' ? 'admin' : 'market')
  }
  const updateUser = (u) => {
    setUser(u)
    localStorage.setItem('fm_user', JSON.stringify(u))
  }

  const logout = () => {
    localStorage.removeItem('fm_token')
    localStorage.removeItem('fm_user')
    setUser(null); setPage('market')
  }

  const unread = Math.max(0, alerts.length - seenCount)

  if (!authChecked) return null
  if (!user) return <AuthPage onAuth={handleAuth} />

  const visibleNav = NAV.filter(n => {
    if (n.roles && !n.roles.includes(normalizedRole)) return false
    return true
  })

  return (
    <div className="app-layout">
      <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={17} color="var(--accent)" />
            </div>
            <span className="hide-on-mobile-small" style={{ fontWeight: 700, fontSize: 16 }}>AgroVision</span>
          </div>

          <nav className="main-nav">
            {visibleNav.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setPage(id)} className={`btn btn-ghost nav-btn ${page === id ? 'active' : ''}`} style={{
                color: page === id ? 'var(--accent)' : 'var(--text2)',
                background: page === id ? 'rgba(74,222,128,0.08)' : 'transparent',
                borderRadius: 8, padding: '7px 12px', fontSize: 13,
                fontWeight: page === id ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, position: 'relative'
              }}>
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{label}</span>
                {id === 'scan' && <span className="nav-indicator" style={{ background: 'var(--accent)' }} />}
                {id === 'agrobot' && <span className="nav-indicator" style={{ background: '#60a5fa' }} />}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost" onClick={() => { setShowAlerts(s => !s); setSeenCount(alerts.length) }} style={{ padding: '7px 10px', position: 'relative', color: unread > 0 ? 'var(--warning)' : 'var(--text2)' }} title={unread > 0 ? `${unread} unread alerts` : 'No unread alerts'}>
                <Bell size={17} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'var(--danger)', borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid var(--bg2)' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showAlerts && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setShowAlerts(false)} />
                  <div style={{ position: 'fixed', top: 70, right: 20, width: 380, maxWidth: 'calc(100vw - 40px)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 2000, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Blight Alerts</span>
                      <span className="badge badge-red" style={{ fontSize: 10 }}>{alerts.length} active</span>
                    </div>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', flex: 1 }}>
                      {alerts.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No alerts</div>
                      ) : alerts.map(a => (
                        <div key={a.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, cursor: 'default' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.severity === 'outbreak' ? 'var(--danger)' : 'var(--warning)', marginTop: 5, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.5, wordWrap: 'break-word' }}>{a.message}</p>
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{a.region}</span>
                              {a.blight_type && <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.1)', color: 'var(--warning)', padding: '2px 6px', borderRadius: 4 }}>{a.blight_type.replace('_', ' ')}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {page === 'market' && (
          <Store
            user={user}
            onUserUpdate={updateUser}
            onAdminAddProduct={isAdmin ? openAdminAddProduct : undefined}
            onAdminEditProduct={isAdmin ? openAdminEditProduct : undefined}
          />
        )}
        {page === 'map' && <FarmMap user={user} />}
        {page === 'scan' && <DiagnosisPage user={user} onDiseaseDetected={setPredictedDisease} onAskDisease={(disease) => { setPredictedDisease(disease); setPage('agrobot') }} />}
        {page === 'fieldlog' && <FieldLogPage user={user} />}
        {page === 'agrobot' && <AgroBotPage disease={predictedDisease} />}
        {page === 'admin' && <AdminPanel pendingAction={adminPanelAction} onActionHandled={() => setAdminPanelAction(null)} />}
      </main>
    </div>
  )
}
