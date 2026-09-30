import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10});

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const createNewAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem cadastrar novos administradores."
    );
  }

  const {email, password, name} = data;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {admin: true});
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, uid: userRecord.uid};
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", errorMessage);
  }
});
