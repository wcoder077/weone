// Reactions to chat messages: one per person per message, from a short fixed list
// (the database accepts only these six, see migration 30).
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type ChatReaction = { userId: string; emoji: string };

export function isReactionEmoji(value: string) {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}

// Sets (or, with null, removes) one person's reaction in a message's list.
export function withReaction(reactions: ChatReaction[], userId: string, emoji: string | null): ChatReaction[] {
  const others = reactions.filter((reaction) => reaction.userId !== userId);
  return emoji ? [...others, { userId, emoji }] : others;
}

export type ReactionGroup = { emoji: string; count: number; mine: boolean };

// "👍 3  ❤️ 1": the same emoji counted together, the most used first.
export function groupReactions(reactions: ChatReaction[], meId: string): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();
  for (const reaction of reactions) {
    const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
    group.count += 1;
    group.mine ||= reaction.userId === meId;
    groups.set(reaction.emoji, group);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}
