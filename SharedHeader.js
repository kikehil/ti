
const PortalHeader = ({ user, title = "TI Región Tamaulipas", subtitle = "Portal de aplicaciones" }) => {
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  };

  const getPlazaLogo = (plaza) => {
    if (!plaza) return null;
    let name = plaza.toUpperCase().trim();
    if (name === "CV VICTORIA") name = "CD VICTORIA";
    return `logos/${name}.png`;
  };

  const plazaLogo = getPlazaLogo(user?.plaza);

  return (
    <header className="p-header">
      <div className="p-header__left">
        <img className="p-logo-tamaulipas" src="logos/tamaulipas.PNG" alt="Tamaulipas" />
        <img className="p-logo-t" src="logos/ti.png" alt="TI" />
        {plazaLogo && <img className="p-logo-plaza" src={plazaLogo} alt="Plaza" />}
      </div>

      <div className="p-header__center">
        <h1 className="p-title">{title}</h1>
        <p className="p-subtitle">{subtitle}</p>
      </div>

      <div className="p-header__right">
        <div className="p-user" role="group" aria-label="Usuario conectado">
          <div className="p-avatar" aria-hidden="true">{user?.initials || '??'}</div>
          <div className="p-user__meta">
            <span className="p-user__name">{user?.name || 'Usuario'}</span>
            <span className="p-user__role">{user?.role || 'Administrador'}</span>
          </div>
        </div>
        <button className="p-signout" type="button" onClick={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Salir
        </button>
      </div>
    </header>
  );
};

// Exponer globalmente para que otros scripts de Babel puedan usarlo
window.PortalHeader = PortalHeader;
