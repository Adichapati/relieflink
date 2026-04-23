export default function Navbar({ scrolled = false }) {
  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-brand">
        Relief<span>Link</span>
      </div>
      <div className="navbar-status">
        <span className="status-dot" />
        <span>System Online</span>
      </div>
    </nav>
  );
}
