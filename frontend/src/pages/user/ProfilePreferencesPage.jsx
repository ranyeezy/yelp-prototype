export default function ProfilePreferencesPage({
  token,
  currentUser,
  currentPreferences,
  profileForm,
  setProfileForm,
  countryOptions,
  profilePhotoUploading,
  setProfilePhotoFile,
  uploadProfilePhoto,
  profilePhotoFile,
  apiBaseUrl,
  saveProfile,
  profileSaving,
  profileMessage,
  preferencesForm,
  setPreferencesForm,
  savePreferences,
  preferencesSaving,
  loadPreferences,
  preferencesMessage,
}) {
  const cuisineOptions = ['italian', 'chinese', 'mexican', 'indian', 'japanese', 'american']
  const dietaryOptions = ['vegetarian', 'vegan', 'halal', 'gluten-free', 'kosher']
  const ambianceOptions = ['casual', 'fine dining', 'family-friendly', 'romantic']
  const sortOptions = ['rating', 'distance', 'popularity', 'price']

  const parseCsvValues = (value) => (
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )

  const togglePreferenceOption = (field, option) => {
    setPreferencesForm((prev) => {
      const selected = new Set(parseCsvValues(prev[field]).map((item) => item.toLowerCase()))
      const normalized = option.toLowerCase()
      if (selected.has(normalized)) {
        selected.delete(normalized)
      } else {
        selected.add(normalized)
      }
      return {
        ...prev,
        [field]: Array.from(selected).join(', '),
      }
    })
  }

  const isSelected = (field, option) => (
    parseCsvValues(preferencesForm[field]).map((item) => item.toLowerCase()).includes(option.toLowerCase())
  )

  const profileInfoRows = [
    ['Full name', currentUser?.name],
    ['Email address', currentUser?.email],
    ['Phone number', currentUser?.phone],
    ['City', currentUser?.city],
    ['State', currentUser?.state],
    ['Country', currentUser?.country],
    ['Languages', currentUser?.languages],
    ['Gender', currentUser?.gender],
    ['About me', currentUser?.about_me],
    ['Profile photo URL', currentUser?.profile_photo],
  ].filter(([, value]) => typeof value === 'string' ? value.trim() : value)

  const preferenceInfoRows = [
    ['Cuisine preferences', currentPreferences?.cuisines],
    ['Price range min', currentPreferences?.price_min ? `$`.repeat(currentPreferences.price_min) : null],
    ['Price range max', currentPreferences?.price_max ? `$`.repeat(currentPreferences.price_max) : null],
    ['Preferred locations', currentPreferences?.preferred_locations],
    ['Search radius (miles)', currentPreferences?.search_radius],
    ['Dietary needs', currentPreferences?.dietary_needs],
    ['Ambiance preferences', currentPreferences?.ambiance],
    ['Sort preference', currentPreferences?.sort_preference],
  ].filter(([, value]) => typeof value === 'string' ? value.trim() : value)

  return (
    <>
      <section className="panel">
        <h2>User Profile Information</h2>
        {profileInfoRows.length === 0 ? (
          <p className="info">No profile details saved yet beyond signup data.</p>
        ) : (
          <div className="profile-info-grid">
            {profileInfoRows.map(([label, value]) => (
              <div key={label} className="profile-info-row">
                <strong>{label}:</strong> <span>{value}</span>
              </div>
            ))}
          </div>
        )}
        {currentUser?.profile_photo && (
          <img
            src={currentUser.profile_photo.startsWith('http') ? currentUser.profile_photo : `${apiBaseUrl}${currentUser.profile_photo}`}
            alt="User profile"
            className="profile-photo-preview"
          />
        )}
      </section>

      <section className="panel">
        <div className="profile-editor-header">
          <h2 className="profile-editor-title">Profile Editor</h2>
          <p className="info profile-editor-intro">Enter only the fields you want to update. The editor stays blank by design.</p>
        </div>
        <form onSubmit={saveProfile} className="stack profile-editor-form">
          <div className="form-grid">
            <label className="field-block">
              <span>Full name</span>
              <input placeholder="Your name" value={profileForm.name} onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Email address</span>
              <input placeholder="name@example.com" type="email" value={profileForm.email} onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Phone number</span>
              <input placeholder="(555) 123-4567" value={profileForm.phone} onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>City</span>
              <input placeholder="Alameda" value={profileForm.city} onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>State (2-letter abbreviation)</span>
              <input placeholder="CA" value={profileForm.state} maxLength={2} onChange={(event) => setProfileForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Country</span>
              <select value={profileForm.country} onChange={(event) => setProfileForm((prev) => ({ ...prev, country: event.target.value }))} disabled={!token}>
                <option value="">Select country</option>
                {countryOptions.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </label>
            <label className="field-block">
              <span>Languages</span>
              <input placeholder="English, Spanish" value={profileForm.languages} onChange={(event) => setProfileForm((prev) => ({ ...prev, languages: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Gender</span>
              <input placeholder="Gender" value={profileForm.gender} onChange={(event) => setProfileForm((prev) => ({ ...prev, gender: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Profile photo URL</span>
              <input placeholder="https://..." value={profileForm.profile_photo} onChange={(event) => setProfileForm((prev) => ({ ...prev, profile_photo: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Upload profile picture</span>
              <input className="profile-file-input" type="file" accept="image/*" onChange={(event) => setProfilePhotoFile(event.target.files?.[0] ?? null)} disabled={!token || profilePhotoUploading} />
            </label>
            <button type="button" onClick={uploadProfilePhoto} disabled={!token || profilePhotoUploading || !profilePhotoFile}>
              {profilePhotoUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
          {profileForm.profile_photo && (
            <img
              src={profileForm.profile_photo.startsWith('http') ? profileForm.profile_photo : `${apiBaseUrl}${profileForm.profile_photo}`}
              alt="User profile"
              className="profile-photo-preview"
            />
          )}
          <label className="field-block">
            <span>About me</span>
            <textarea placeholder="Share your favorite food styles and dining interests" value={profileForm.about_me} onChange={(event) => setProfileForm((prev) => ({ ...prev, about_me: event.target.value }))} disabled={!token} />
          </label>
          <button type="submit" disabled={!token || profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</button>
        </form>
        {profileMessage && <p className="info">{profileMessage}</p>}
      </section>

      <section className="panel">
        <h2>Preferences</h2>
        {preferenceInfoRows.length === 0 ? (
          <p className="info">No saved preferences yet. Add your preferences in the editor below.</p>
        ) : (
          <div className="profile-info-grid">
            {preferenceInfoRows.map(([label, value]) => (
              <div key={label} className="profile-info-row">
                <strong>{label}:</strong> <span>{value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Preferences Editor</h2>
        <p className="info">These saved preferences are used by the AI Assistant to personalize recommendations.</p>
        <form onSubmit={savePreferences} className="stack">
          <div className="stack preference-section">
            <h3>Cuisine preferences</h3>
            <div className="checkbox-grid">
              {cuisineOptions.map((option) => (
                <label key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isSelected('cuisines', option)}
                    onChange={() => togglePreferenceOption('cuisines', option)}
                    disabled={!token}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <label className="field-block">
              <span>Price range minimum</span>
              <select value={preferencesForm.price_min} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, price_min: event.target.value }))} disabled={!token}>
                <option value="">No minimum</option>
                <option value="1">$</option>
                <option value="2">$$</option>
                <option value="3">$$$</option>
                <option value="4">$$$$</option>
              </select>
            </label>
            <label className="field-block">
              <span>Price range maximum</span>
              <select value={preferencesForm.price_max} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, price_max: event.target.value }))} disabled={!token}>
                <option value="">No maximum</option>
                <option value="1">$</option>
                <option value="2">$$</option>
                <option value="3">$$$</option>
                <option value="4">$$$$</option>
              </select>
            </label>
            <label className="field-block">
              <span>Preferred locations (comma-separated)</span>
              <input placeholder="Alameda, Oakland, Berkeley" value={preferencesForm.preferred_locations} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, preferred_locations: event.target.value }))} disabled={!token} />
            </label>
            <label className="field-block">
              <span>Search radius (miles)</span>
              <input type="number" min={1} placeholder="10" value={preferencesForm.search_radius} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, search_radius: event.target.value }))} disabled={!token} />
            </label>
          </div>

          <div className="stack preference-section">
            <h3>Dietary needs / restrictions</h3>
            <div className="checkbox-grid">
              {dietaryOptions.map((option) => (
                <label key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isSelected('dietary_needs', option)}
                    onChange={() => togglePreferenceOption('dietary_needs', option)}
                    disabled={!token}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="stack preference-section">
            <h3>Ambiance preferences</h3>
            <div className="checkbox-grid">
              {ambianceOptions.map((option) => (
                <label key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isSelected('ambiance', option)}
                    onChange={() => togglePreferenceOption('ambiance', option)}
                    disabled={!token}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="field-block">
            <span>Sort preference</span>
            <select value={preferencesForm.sort_preference} onChange={(event) => setPreferencesForm((prev) => ({ ...prev, sort_preference: event.target.value }))} disabled={!token}>
              <option value="">Select sort preference</option>
              {sortOptions.map((option) => (
                <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
              ))}
            </select>
          </label>
          <div className="row wrap">
            <button type="submit" disabled={preferencesSaving || !token}>{preferencesSaving ? 'Saving...' : 'Save Preferences'}</button>
          </div>
        </form>
        {preferencesMessage && <p className="info">{preferencesMessage}</p>}
      </section>
    </>
  )
}
