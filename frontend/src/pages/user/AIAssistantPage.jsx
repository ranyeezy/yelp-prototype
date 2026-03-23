import { useEffect, useRef } from 'react'

const PRICE_SYMBOLS = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' }

function PriceTag({ tier }) {
  if (!tier) return <span className="ai-meta-chip">Price N/A</span>
  return <span className="ai-meta-chip">{PRICE_SYMBOLS[tier] ?? tier}</span>
}

function StarRating({ rating }) {
  if (rating == null) return <span className="ai-meta-chip">No rating</span>
  const filled = Math.round(rating)
  return (
    <span className="ai-meta-chip" style={{ color: '#e53e3e' }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)} {parseFloat(rating).toFixed(1)}
    </span>
  )
}

function RecommendationCard({ restaurant, getRestaurantImage, openRestaurantDetails }) {
  return (
    <div
      className="ai-rec-card"
      role="button"
      tabIndex={0}
      onClick={() => openRestaurantDetails(restaurant.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openRestaurantDetails(restaurant.id) }}
    >
      <div
        className="ai-rec-cover"
        style={{ backgroundImage: `url(${getRestaurantImage(restaurant)})` }}
      />
      <div className="ai-rec-body">
        <div className="ai-rec-top">
          <span className="ai-rec-name">{restaurant.name}</span>
          <span className="ai-rec-cuisine">{restaurant.cuisine_type}</span>
        </div>
        <div className="ai-rec-city">{restaurant.city}</div>
        <div className="ai-rec-meta">
          <StarRating rating={restaurant.rating} />
          <PriceTag tier={restaurant.price_tier} />
        </div>
        {restaurant.reason && (
          <div className="ai-rec-reason">✦ {restaurant.reason}</div>
        )}
      </div>
    </div>
  )
}

function ChatBubble({ msg, recommendations, getRestaurantImage, openRestaurantDetails }) {
  const isUser = msg.role === 'user'
  const lines = msg.content.split('\n').filter(Boolean)

  return (
    <div className={`ai-bubble-row ${isUser ? 'ai-bubble-row--user' : 'ai-bubble-row--assistant'}`}>
      {!isUser && (
        <div className="ai-avatar">🤖</div>
      )}
      <div className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--assistant'}`}>
        {lines.map((line, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '0.3rem 0 0' }}>{line}</p>
        ))}
        {!isUser && recommendations && recommendations.length > 0 && (
          <div className="ai-rec-list">
            {recommendations.map((r) => (
              <RecommendationCard
                key={r.id}
                restaurant={r}
                getRestaurantImage={getRestaurantImage}
                openRestaurantDetails={openRestaurantDetails}
              />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="ai-avatar ai-avatar--user">👤</div>
      )}
    </div>
  )
}

export default function AIAssistantPage({
  submitAiMessage,
  aiInput,
  setAiInput,
  quickPrompts = [],
  onQuickPrompt,
  aiLoading,
  clearAiConversation,
  aiConversation,
  aiMessage,
  aiRecommendations,
  getRestaurantImage,
  openRestaurantDetails,
  token,
  compact = false,
}) {
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiConversation, aiLoading])

  // Pair each assistant message with the recommendations that came right after
  // Recommendations are attached to the last assistant message
  const conversationWithRecs = aiConversation.map((msg, index) => {
    const isLastAssistant =
      msg.role === 'assistant' &&
      !aiConversation.slice(index + 1).some((m) => m.role === 'assistant')
    return {
      msg,
      recs: isLastAssistant ? aiRecommendations : [],
    }
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitAiMessage(e)
    }
  }

  return (
    <div className={`ai-chat-root ${compact ? 'ai-chat-root--compact' : ''}`}>

      {/* ── Conversation area ── */}
      <div className="ai-messages">
        {aiConversation.length === 0 && !aiLoading && (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">🍽️</div>
            <p className="ai-empty-title">Hi! I'm your dining assistant.</p>
            <p className="ai-empty-sub">
              Ask me anything — cuisine, budget, occasion, or vibe.<br />
              I'll find the best matches from our restaurant database.
            </p>
            {quickPrompts.length > 0 && (
              <div className="ai-quick-row">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="ai-quick-btn"
                    disabled={aiLoading || (!token)}
                    onClick={() => onQuickPrompt?.(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {!token && (
              <p className="ai-login-note">⚠️ Please log in to use the AI Assistant.</p>
            )}
          </div>
        )}

        {conversationWithRecs.map(({ msg, recs }, index) => (
          <ChatBubble
            key={`${msg.role}-${index}`}
            msg={msg}
            recommendations={recs}
            getRestaurantImage={getRestaurantImage}
            openRestaurantDetails={openRestaurantDetails}
          />
        ))}

        {aiLoading && (
          <div className="ai-bubble-row ai-bubble-row--assistant">
            <div className="ai-avatar">🤖</div>
            <div className="ai-bubble ai-bubble--assistant ai-bubble--typing">
              <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
            </div>
          </div>
        )}

        {aiMessage && !aiLoading && (
          <div className="ai-system-msg">{aiMessage}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick prompts (when conversation started) ── */}
      {aiConversation.length > 0 && quickPrompts.length > 0 && (
        <div className="ai-quick-row ai-quick-row--inline">
          {quickPrompts.map((p) => (
            <button
              key={p}
              type="button"
              className="ai-quick-btn"
              disabled={aiLoading || !token}
              onClick={() => onQuickPrompt?.(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="ai-input-area">
        <form onSubmit={submitAiMessage} className="ai-input-form">
          <textarea
            ref={inputRef}
            className="ai-input-field"
            placeholder={token ? 'Ask about cuisine, city, budget, occasion…' : 'Log in to use the AI assistant'}
            value={aiInput}
            disabled={!token || aiLoading}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            type="submit"
            className="ai-send-btn"
            disabled={!token || aiLoading || !aiInput.trim()}
            title="Send"
          >
            {aiLoading ? '…' : '➤'}
          </button>
        </form>
        <button
          type="button"
          className="ai-clear-btn"
          onClick={clearAiConversation}
          disabled={aiLoading || aiConversation.length === 0}
        >
          Clear chat
        </button>
      </div>
    </div>
  )
}
