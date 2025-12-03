import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export async function cleanupTyping() {
  const typingRef = db.ref('/typing');
  const snapshot = await typingRef.get();
  if (!snapshot.exists()) return;
  const updates: Record<string, null> = {};
  snapshot.forEach((scope) => {
    scope.forEach((chat) => {
      chat.forEach((user) => {
        updates[`${scope.key}/${chat.key}/${user.key}`] = null;
      });
    });
  });
  await typingRef.update(updates);
}

export async function cleanupInvites() {
  const now = Date.now();
  const invitesRef = db.ref('/invites');
  const snapshot = await invitesRef.get();
  if (!snapshot.exists()) return;
  const updates: Record<string, null> = {};
  snapshot.forEach((invite) => {
    const value = invite.val();
    if (value.expiresAt < now || value.useCount >= value.maxUses) {
      updates[invite.key] = null;
    }
  });
  if (Object.keys(updates).length) {
    await invitesRef.update(updates);
  }
}
