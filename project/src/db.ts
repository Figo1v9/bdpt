import { openDB } from 'idb';

const DB_NAME = 'exam-system-db';
const STORE_NAME = 'subjects';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  return db;
};

export const saveSubjects = async (subjects: any) => {
  const db = await initDB();
  await db.put(STORE_NAME, subjects, 'current');
  return subjects;
};

export const getSubjects = async () => {
  const db = await initDB();
  return await db.get(STORE_NAME, 'current');
};