import { db, auth, storage, serverTimestamp, isConfigured } from '../firebase/config';
import { Job, PunchlistItem } from '../types';

// Export auth for easy use in components
export { auth, isConfigured };

// --- Job Functions ---
export const getJobs = (userId: string, callback: (jobs: Job[]) => void) => {
  if (!db) {
    callback([]);
    return () => {}; // Return a no-op unsubscribe function
  }
  const jobsCollection = db.collection('jobs');
  return jobsCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      callback(jobs);
    });
};

export const addJob = async (name: string, userId: string): Promise<any> => {
  if (!db) return Promise.reject(new Error("Firebase not configured"));
  const jobsCollection = db.collection('jobs');
  const newJob: Omit<Job, 'id'> = {
    name,
    userId,
    createdAt: new Date().toISOString(),
    items: [],
  };
  return await jobsCollection.add(newJob);
};

export const deleteJob = async (jobId: string) => {
  if (!db) return Promise.reject(new Error("Firebase not configured"));
  const jobsCollection = db.collection('jobs');
  // In a real app, you would also delete associated storage items.
  // For simplicity, we are only deleting the database record here.
  return await jobsCollection.doc(jobId).delete();
};


// --- Punchlist Item Functions ---

const uploadImage = async (file: File, userId: string, jobId: string): Promise<string> => {
  if (!storage) return Promise.reject(new Error("Firebase Storage not configured"));
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substring(2);
  const fileName = `${timestamp}-${randomSuffix}-${file.name}`;
  const filePath = `images/${userId}/${jobId}/${fileName}`;
  const storageRef = storage.ref(filePath);
  await storageRef.put(file);
  return await storageRef.getDownloadURL();
};

export const addItem = async (
  jobId: string,
  itemData: Omit<PunchlistItem, 'id' | 'createdAt' | 'photo'>,
  photoFile: File
) => {
  if (!db) return Promise.reject(new Error("Firebase not configured"));
  const jobsCollection = db.collection('jobs');
  const jobDoc = jobsCollection.doc(jobId);
  const jobSnapshot = await jobDoc.get();
  if (!jobSnapshot.exists) throw new Error("Job not found!");

  const job = jobSnapshot.data() as Job;
  const imageUrl = await uploadImage(photoFile, job.userId, jobId);

  const newItem: PunchlistItem = {
    ...itemData,
    id: db.collection('dummy').doc().id, // Generate a unique ID
    createdAt: new Date().toISOString(),
    photo: imageUrl,
  };

  const updatedItems = [newItem, ...job.items];
  return await jobDoc.update({ items: updatedItems });
};

export const deleteItem = async (jobId:string, itemId: string) => {
    if (!db || !storage) return Promise.reject(new Error("Firebase not configured"));
    const jobsCollection = db.collection('jobs');
    const jobDoc = jobsCollection.doc(jobId);
    const jobSnapshot = await jobDoc.get();
    if (!jobSnapshot.exists) throw new Error("Job not found!");
    
    const job = jobSnapshot.data() as Job;
    const itemToDelete = job.items.find(item => item.id === itemId);

    // Delete photo from storage
    if (itemToDelete && itemToDelete.photo) {
        try {
            const photoRef = storage.refFromURL(itemToDelete.photo);
            await photoRef.delete();
        } catch(error) {
            console.error("Error deleting image from storage:", error);
            // Don't block DB update if image deletion fails
        }
    }

    const updatedItems = job.items.filter(item => item.id !== itemId);
    return await jobDoc.update({ items: updatedItems });
};