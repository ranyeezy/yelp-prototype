export default function OwnerSignupPage({ ownerForm, setOwnerForm, onOwnerAuthSubmit, ownerAuthLoading, ownerMessage, currentOwner, currentUser, logout }) {
  // Block owner signup while a user session is active
  if (currentUser) {
    return (
      <section className="panel stack">
        <h2>Owner Sign Up</h2>
        <p className="info">
          You are currently logged in as user <strong>{currentUser.name}</strong>. You must log out of your user account before creating an owner account.
        </p>
        <button className="solid-small" onClick={logout}>User Logout</button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Owner Signup Interface</h2>
      <form onSubmit={onOwnerAuthSubmit} className="stack">
        <input value={ownerForm.name} onChange={(event) => setOwnerForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Owner full name" required />
        <input value={ownerForm.restaurant_location} onChange={(event) => setOwnerForm((prev) => ({ ...prev, restaurant_location: event.target.value }))} placeholder="Primary restaurant location" required />
        <input value={ownerForm.email} onChange={(event) => setOwnerForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Owner email" type="email" required />
        <input value={ownerForm.password} onChange={(event) => setOwnerForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Owner password" type="password" required />
        <button type="submit" disabled={ownerAuthLoading}>{ownerAuthLoading ? 'Please wait...' : 'Owner Sign Up'}</button>
      </form>

      {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
