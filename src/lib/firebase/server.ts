import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Wait, we don't have service account JSON easily here, let's just use the projectId for simple token verification, Firebase doesn't strictly need creds for just verifying tokens if project id is set.
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = admin.auth();
