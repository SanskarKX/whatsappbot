// Utilities to filter WhatsApp chats/messages

export function isPersonalChat(chat) {
  // chat.isGroup: true for groups
  // chat.isNewsletter: true for channels (a.k.a. newsletters). Older versions may not have this flag.
  const isGroup = Boolean(chat?.isGroup) || chat?.id?.server === 'g.us';
  // Some builds may expose newsletters/channels differently; check common flags/servers
  const isNewsletter = Boolean(chat?.isNewsletter) || chat?.id?.server === 'newsletter';
  const isCommunity = Boolean(chat?.isCommunity) || chat?.id?.server === 'community';
  return !(isGroup || isNewsletter || isCommunity);
}
