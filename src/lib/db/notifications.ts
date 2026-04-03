import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification, NotificationType } from "@/types";

const NOTIFICATIONS_COLLECTION = "notifications";

// Create a new notification
export const createNotification = async (
  message: string,
  type: NotificationType,
  creatorName: string,
  targetId?: string,
  targetTab?: string
) => {
  const notificationData: any = {
    message,
    type,
    creatorName,
    readBy: [], // Array of UIDs
    createdAt: serverTimestamp(),
  };

  // Firestore does not support 'undefined' values. Only add if they exist.
  if (targetId !== undefined) notificationData.targetId = targetId;
  if (targetTab !== undefined) notificationData.targetTab = targetTab;

  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
};

// Fetch recent notifications (real-time)
export const subscribeToNotifications = (callback: (notifications: AppNotification[]) => void) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      } as AppNotification;
    });
    callback(notifications);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string, userUid: string) => {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(notificationRef, {
    readBy: arrayUnion(userUid),
  });
};
