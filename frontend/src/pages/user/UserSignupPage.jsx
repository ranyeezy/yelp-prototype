export default function UserSignupPage({ authForm, setAuthForm, onAuthSubmit, authLoading, authMessage, currentUser }) {
  return (
    <section className="panel">
      <h2>User Sign Up</h2>
      <p className="info">Create your account here, then log in from the User Login page.</p>
      <form onSubmit={onAuthSubmit} className="stack">
        <input
          value={authForm.name}
          onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Full name"
          required
        />
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
          {authLoading ? 'Please wait...' : 'Create Account'}
        </button>
      </form>

      {currentUser && <p className="success">Logged in as: {currentUser.name} ({currentUser.email})</p>}
      {authMessage && <p className="info">{authMessage}</p>}
    </section>
  )
}
