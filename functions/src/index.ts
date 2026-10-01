import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();

functions.setGlobalOptions({maxInstances: 10});

admin.initializeApp();

export const defineNewUserAdmin = functions.https.onCall(async (request) => {
  const uid = request.data.uid;

  try {
    const adminsSnapshot = await db.collection("admins").limit(1).get();
    const hasAnyAdmin = !adminsSnapshot.empty;

    if (!hasAnyAdmin) {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      await db.collection("admins").doc(uid).set({
        createAt: admin.firestore.FieldValue.serverTimestamp(),
        firstAdmin: true,
      });
    }

  } catch (error) {
    const err = error as Error;
    throw new functions.https.HttpsError("internal", err.message);
  }
});

export const defineUserAdmin = functions.https.onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem definir outros administradores."
    );
  }

  const { uid } = request.data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "O UID do usuário é obrigatório.");
  }

  await admin.auth().setCustomUserClaims(uid, { admin: true });
  await db.collection("admins").doc(uid).set({
          createAt: admin.firestore.FieldValue.serverTimestamp(),
          firstAdmin: false,
          createdBy: request.auth.uid,
        });

  return { success: true, message: `Usuário ${uid} agora é um administrador.` };
});