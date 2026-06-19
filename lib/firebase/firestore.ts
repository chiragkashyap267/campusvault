import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { db } from "./config";
import {
  Resource,
  User,
  Comment,
  Note,
  Todo,
  WishlistItem,
  ResourceFilters,
} from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────
function toResource(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Resource {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt,
  } as Resource;
}

// ─── User Management ─────────────────────────────────────────
export async function createUserDocument(
  user: FirebaseUser,
  extra?: Partial<User>
) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || extra?.displayName || "",
      email: user.email,
      photoURL: user.photoURL || "",
      bio: "",
      role: "user",
      uploadCount: 0,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt,
  } as User;
}

export async function updateUserProfile(uid: string, data: Partial<User>) {
  await updateDoc(doc(db, "users", uid), { ...data });
}

export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists();
  } catch {
    // Firestore rules may deny read access for non-admins — that's fine, just return false
    return false;
  }
}

// ─── Resources ────────────────────────────────────────────────
export async function getResources(
  filters: ResourceFilters = {},
  pageSize = 100,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ resources: Resource[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: any[] = [where("status", "==", "approved")];

  if (filters.branch) constraints.push(where("branch", "==", filters.branch));
  if (filters.semester) constraints.push(where("semester", "==", filters.semester));
  if (filters.subject) constraints.push(where("subject", "==", filters.subject));
  if (filters.type) constraints.push(where("type", "==", filters.type));

  let q;
  if (constraints.length === 1) {
    q = query(collection(db, "resources"), ...constraints, orderBy("createdAt", "desc"), limit(pageSize));
  } else {
    // Drop orderBy to avoid composite index errors. Firestore will use index merging for the equality constraints.
    q = query(collection(db, "resources"), ...constraints, limit(pageSize));
  }

  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  let resources = snap.docs.map(toResource);

  if (constraints.length > 1) {
    resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { resources, lastDoc: newLastDoc };
}

export async function getFeaturedResources(): Promise<Resource[]> {
  const q = query(
    collection(db, "resources"),
    where("status", "==", "approved"),
    where("featured", "==", true),
    limit(6)
  );
  const snap = await getDocs(q);
  return snap.docs.map(toResource);
}

export async function getRecentResources(count = 6): Promise<Resource[]> {
  const q = query(
    collection(db, "resources"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(toResource);
}

export async function getTrendingResources(count = 6): Promise<Resource[]> {
  const q = query(
    collection(db, "resources"),
    where("status", "==", "approved"),
    orderBy("downloads", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(toResource);
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const snap = await getDoc(doc(db, "resources", id));
  if (!snap.exists()) return null;
  return toResource(snap);
}

export async function createResource(data: Omit<Resource, "id" | "createdAt" | "downloads" | "likes" | "likedBy">): Promise<string> {
  const ref = await addDoc(collection(db, "resources"), {
    ...data,
    status: "pending",
    downloads: 0,
    likes: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateResource(id: string, data: Partial<Resource>) {
  await updateDoc(doc(db, "resources", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteResource(id: string) {
  await deleteDoc(doc(db, "resources", id));
}

export async function approveResource(id: string) {
  await updateDoc(doc(db, "resources", id), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
}

export async function rejectResource(id: string) {
  await updateDoc(doc(db, "resources", id), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
}

export async function getPendingResources(): Promise<Resource[]> {
  const q = query(
    collection(db, "resources"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  const resources = snap.docs.map(toResource);
  return resources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUserResources(uid: string): Promise<Resource[]> {
  const q = query(
    collection(db, "resources"),
    where("uploadedBy", "==", uid)
  );
  const snap = await getDocs(q);
  const resources = snap.docs.map(toResource);
  return resources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function incrementDownload(id: string) {
  await updateDoc(doc(db, "resources", id), { downloads: increment(1) });
}

export async function toggleLike(resourceId: string, uid: string, liked: boolean) {
  const ref = doc(db, "resources", resourceId);
  await updateDoc(ref, {
    likes: liked ? increment(1) : increment(-1),
    likedBy: liked ? arrayUnion(uid) : arrayRemove(uid),
  });
}

// ─── Comments ─────────────────────────────────────────────────
export async function getComments(resourceId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments", resourceId, "messages"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    } as Comment;
  });
}

export async function addComment(
  resourceId: string,
  comment: Omit<Comment, "id" | "createdAt">
) {
  await addDoc(collection(db, "comments", resourceId, "messages"), {
    ...comment,
    createdAt: serverTimestamp(),
  });
}

// ─── Wishlist ─────────────────────────────────────────────────
export async function getWishlist(uid: string): Promise<WishlistItem[]> {
  const q = query(
    collection(db, "wishlist", uid, "items"),
    orderBy("savedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as WishlistItem[];
}

export async function addToWishlist(uid: string, resourceId: string) {
  await setDoc(doc(db, "wishlist", uid, "items", resourceId), {
    resourceId,
    savedAt: serverTimestamp(),
  });
}

export async function removeFromWishlist(uid: string, resourceId: string) {
  await deleteDoc(doc(db, "wishlist", uid, "items", resourceId));
}

export async function isInWishlist(uid: string, resourceId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "wishlist", uid, "items", resourceId));
  return snap.exists();
}

// ─── Notes ────────────────────────────────────────────────────
export async function getNotes(uid: string): Promise<Note[]> {
  const q = query(
    collection(db, "notes", uid, "items"),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    } as Note;
  });
}

export async function saveNote(uid: string, note: Omit<Note, "id" | "uid" | "createdAt" | "updatedAt">, noteId?: string): Promise<string> {
  if (noteId) {
    await updateDoc(doc(db, "notes", uid, "items", noteId), {
      ...note,
      updatedAt: serverTimestamp(),
    });
    return noteId;
  }
  const ref = await addDoc(collection(db, "notes", uid, "items"), {
    ...note,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteNote(uid: string, noteId: string) {
  await deleteDoc(doc(db, "notes", uid, "items", noteId));
}

// ─── Todos ────────────────────────────────────────────────────
export async function getTodos(uid: string): Promise<Todo[]> {
  const q = query(
    collection(db, "todos", uid, "items"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    } as Todo;
  });
}

export async function saveTodo(uid: string, todo: Omit<Todo, "id" | "uid" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "todos", uid, "items"), {
    ...todo,
    uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTodo(uid: string, todoId: string, data: Partial<Todo>) {
  await updateDoc(doc(db, "todos", uid, "items", todoId), data);
}

export async function deleteTodo(uid: string, todoId: string) {
  await deleteDoc(doc(db, "todos", uid, "items", todoId));
}

// ─── Admin Stats ──────────────────────────────────────────────
export async function getAllResources(): Promise<Resource[]> {
  const snap = await getDocs(collection(db, "resources"));
  return snap.docs.map(toResource);
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    } as User;
  });
}

// ─── Leaderboard ──────────────────────────────────────────────
export async function getLeaderboard(count = 20): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    orderBy("uploadCount", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    } as User;
  });
}

export async function incrementUserUploadCount(uid: string) {
  await updateDoc(doc(db, "users", uid), {
    uploadCount: increment(1),
  });
}
