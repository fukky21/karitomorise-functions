const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification = functions
  .region("asia-northeast1")
  .firestore.document("posts/{postId}")
  .onCreate(async (snap, context) => {
    try {
      const data = snap.data();
      const body = data["body"];
      const number = data["number"];
      const replyToNumber = data["replyToNumber"];

      if (!replyToNumber) {
        // 返信先がない場合は終了する
        return;
      }

      const snapshot = await admin
        .firestore()
        .collection("posts")
        .where("number", "==", replyToNumber)
        .get();
      const docs = snapshot.docs;

      if (docs.length == 0) {
        functions.logger.error(
          `Post document is not found. ( number: ${replyToNumber} )`
        );
        return;
      }

      if (docs.length > 1) {
        functions.logger.error(
          `The same number post exists. ( number: ${replyToNumber} )`
        );
        return;
      }

      const doc = docs[0];
      const uid = doc.data()["uid"];

      if (!uid) {
        // 返信先の投稿が匿名投稿の場合は終了する
        return;
      }

      const userDocRef = admin.firestore().collection("users").doc(uid);

      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) {
          functions.logger.error(`User document is not found. ( uid: ${uid} )`);
          return;
        }

        const tokens = userDoc.data()["notificationTokens"];

        if (!tokens.length) {
          functions.logger.log("Notification tokens don't exist.");
        } else {
          const payload = {
            notification: {
              title: `>>${replyToNumber}`,
              body: `${body}`,
              badge: "1",
              sound: "default",
            },
          };
          const response = await admin
            .messaging()
            .sendToDevice(tokens, payload);
          const results = response.results;
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const error = result.error;
            if (error) {
              functions.logger.error(
                "Failure sending notification to",
                tokens[i],
                error
              );
              if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
              ) {
                transaction.update(userDocRef, {
                  notificationTokens: admin.firestore.FieldValue.arrayRemove(
                    tokens[i]
                  ),
                });
              }
            }
          }
        }

        transaction.set(userDocRef.collection("notifications").doc(), {
          documentVersion: 1,
          postNumber: number,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      return;
    } catch (error) {
      functions.logger.error(error);
      return;
    }
  });
