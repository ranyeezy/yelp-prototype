export default function UserLoginPage({ authForm, setAuthForm, onAuthSubmit, authLoading, authMessage, token, logout, currentUser, currentOwner, ownerLogout }) {
  // Block user login while an owner session is active
  if (currentOwner) {
    return (
      <section className="panel stack">
        <h2>User Login</h2>
        <p className="info">
          You are currently logged in as owner <strong>{currentOwner.name}</strong>. You must log out of the Owner Portal before logging in as a user.
        </p>
        <button className="solid-small" onClick={ownerLogout}>Owner Logout</button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>User Login</h2>
      <div className="row wrap">
        {token && <button onClick={logout}>Logout</button>}
      </div>

      <form onSubmit={onAuthSubmit} className="stack">
        <input
          value={authForm.email}
          onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={authForm.password}
          onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password"
          type="password"
          required
        />
        <button type="submit" disabled={authLoading}>
          {authLoading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      {currentUser && <p className="success">Logged in as: {currentUser.name} ({currentUser.email})</p>}
      {authMessage && <p className="info">{authMessage}</p>}
    </section>
  )
}
