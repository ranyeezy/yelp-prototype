export default function OwnerLoginPage({ ownerForm, setOwnerForm, onOwnerAuthSubmit, ownerAuthLoading, ownerMessage, currentOwner, currentUser, logout }) {
  // Block owner login while a user session is active
  if (currentUser) {
    return (
      <section className="panel stack">
        <h2>Owner Login Interface</h2>
        <p className="info">
          You are currently logged in as user <strong>{currentUser.name}</strong>. You must log out of your user account before logging in as an owner.
        </p>
        <button className="solid-small" onClick={logout}>User Logout</button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Owner Login Interface</h2>
      <form onSubmit={onOwnerAuthSubmit} className="stack">
        <input value={ownerForm.email} onChange={(event) => setOwnerForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Owner email" type="email" required />
        <input value={ownerForm.password} onChange={(event) => setOwnerForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Owner password" type="password" required />
        <button type="submit" disabled={ownerAuthLoading}>{ownerAuthLoading ? 'Please wait...' : 'Owner Login'}</button>
      </form>

      {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
