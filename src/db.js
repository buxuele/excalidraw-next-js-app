// 文件: src/db.js

import { openDB } from 'idb';

const DB_NAME = 'my-excalidraw-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'pages';

// 1. 我们不再立即创建 promise，而是把它设为 null
let dbPromise = null;

// 2. 创建一个“获取器”函数
const getDb = () => {
  // 3. 关键检查：只有在浏览器环境 (window 存在) 才继续
  if (typeof window !== 'undefined') {
    // 4. 如果 promise 还未创建，就创建它（懒加载）
    if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      });
    }
    return dbPromise;
  }
  // 5. 如果在服务器环境，返回 null
  return null;
};

// 6. 修改导出的对象，让每个方法都先调用 getDb
export const db = {
  async getAllPages() {
    const db = await getDb();
    // 如果在服务端，db 为 null，直接返回空数组，避免错误
    if (!db) return []; 
    return db.getAll(STORE_NAME);
  },
  async getPageById(id) {
    const db = await getDb();
    if (!db) return null; // 在服务端返回 null
    return db.get(STORE_NAME, id);
  },
  async upsertPage(page) {
    const db = await getDb();
    if (!db) return Promise.resolve(); // 在服务端什么也不做
    return db.put(STORE_NAME, page);
  },
  async deletePage(id) {
    const db = await getDb();
    if (!db) return Promise.resolve(); // 在服务端什么也不做
    return db.delete(STORE_NAME, id);
  },
};