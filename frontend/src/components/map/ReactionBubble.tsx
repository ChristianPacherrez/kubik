'use client'

// ReactionBubble — ephemeral emoji that pops & floats above an avatar
//
// Driven by: realtime.store reactions[userId] for peers,
//            work-mode.store localReaction for the local player.
// Animation: reactionPop CSS keyframe (2.5s, forwards — stays at opacity:0 until
//            React unmounts it when the store value is cleared after 2500ms).

interface ReactionBubbleProps {
  emoji: string | null | undefined
}

export function ReactionBubble({ emoji }: ReactionBubbleProps) {
  if (!emoji) return null

  return (
    <div
      aria-hidden
      key={emoji + Date.now()} // force remount if same emoji fires twice
      style={{
        position:      'absolute',
        top:           -32,
        left:          '50%',
        fontSize:      18,
        lineHeight:    1,
        pointerEvents: 'none',
        userSelect:    'none',
        zIndex:        10,
        animation:     'reactionPop 2.5s ease-out forwards',
        filter:        'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
      }}
    >
      {emoji}
    </div>
  )
}
