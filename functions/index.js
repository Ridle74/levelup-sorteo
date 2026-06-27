const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

// Se dispara con cada escritura en msgs/group o msgs/dm_<studentId>. Detecta los mensajes
// realmente nuevos (comparando contra el array anterior) y les manda un push por FCM a quien
// corresponda, excluyendo siempre al remitente. Funciona con la pestaña cerrada porque el push
// llega directo al sistema operativo (vía el service worker en el navegador del destinatario).
exports.onNewMsg = onDocumentWritten('msgs/{docId}', async (event) => {
  const docId = event.params.docId;
  const beforeMsgs = event.data.before.exists ? (event.data.before.data().msgs || []) : [];
  const afterMsgs  = event.data.after.exists  ? (event.data.after.data().msgs  || []) : [];
  if (afterMsgs.length <= beforeMsgs.length) return; // edición/borrado, no un mensaje nuevo

  const beforeIds = new Set(beforeMsgs.map(m => m.id));
  const nuevos = afterMsgs.filter(m => !beforeIds.has(m.id));
  if (!nuevos.length) return;

  // Canal: 'group' = todos los registrados; 'dm_<sid>' = ese alumno + el profe.
  const isGroup = docId === 'group';
  const sid = isGroup ? null : docId.slice(3);

  const tokensSnap = await db.collection('fcmTokens').get();
  const tokensByUid = {};
  tokensSnap.forEach(d => {
    const { uid } = d.data() || {};
    if (!uid) return;
    (tokensByUid[uid] = tokensByUid[uid] || []).push(d.id);
  });
  const recipientUids = isGroup ? Object.keys(tokensByUid) : ['teacher', sid];

  const invalidTokens = [];
  for (const m of nuevos) {
    const targets = recipientUids.filter(uid => uid !== m.from);
    const tokens = targets.flatMap(uid => tokensByUid[uid] || []);
    if (!tokens.length) continue;

    const title = (isGroup ? '📢 ' : '💬 ') + (m.fromName || 'Mensaje nuevo');
    const body  = m.text || (m.att
      ? (m.att.type === 'image' ? '📎 Envió una imagen' : m.att.type === 'link' ? '🔗 Envió un enlace' : '📄 Envió un archivo')
      : '');

    const resp = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { key: docId, tag: docId + '_' + m.id, url: '/student/tareas' }
    });

    resp.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
        invalidTokens.push(tokens[i]);
      }
    });
  }

  await Promise.all(invalidTokens.map(t => db.collection('fcmTokens').doc(t).delete()));
});
