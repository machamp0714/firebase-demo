import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import puppeteer from 'puppeteer';
import { subDays } from 'date-fns';

import { collectionName } from './services/constants';
import { feedCalendar } from './crawlers/kodansha-calendar';
import { saveFeedMemo } from './firestore-admin/feed-memo';
import { createBook } from './firestore-admin/books';
import { findOrCreateAuthors } from './firestore-admin/author';
import { findPublisher } from './firestore-admin/publisher';
import { findBookItem } from './services/rakuten/api';
import { sleep } from './utils/timer';
import { FeedMemo } from './services/models/feed-memo';

const RAKUTEN_APP_ID = functions.config().rakuten.app_id;

admin.initializeApp();

const PUPPETEER_OPTIONS = {
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ],
  headless: true
};

export const publishers = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    const snap = await admin
      .firestore()
      .collection(collectionName.publishers)
      .get();
    
    const data = snap.docs.map(doc => doc.data());
    res.send({ data });
  });

export const fetchCalendar = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
  })
  .pubsub.schedule('0 2 1,10,20 * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    const db = admin.firestore();
    const memos = await feedCalendar(page);
    const fetchCount = await saveFeedMemo(db, memos, 'kodansha');
    await browser.close();
    console.log(`Fetched Kodansha calendar. Wrote ${fetchCount} memos.`);
  });

export const registerBooks = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .pubsub.schedule('5,10,15 2 1,10,20 * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const db = admin.firestore();
    const yesterday = subDays(new Date(), 1);
    const snap = await db
      .collection(collectionName.feedMemos)
      .where('isbn', '==', null)
      .where('fetchedAt', '<', yesterday)
      .limit(20)
      .get();

    let count = 0;
    
    for await (const doc of snap.docs) {
      const memo = doc.data() as FeedMemo;
      const title = memo.title || '';
      const publisherName = memo.publisher || '';

      const bookItem = await findBookItem(
        { title, publisherName },
        RAKUTEN_APP_ID
      );

      if (bookItem) {
        const authors = await findOrCreateAuthors(db, bookItem);
        const publisher = await findPublisher(db, 'kodansha');
        const book = await createBook(db, memo, bookItem, authors, publisher);
        await doc.ref.update({
          isbn: book.isbn,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count += 1;
      } else {
        await doc.ref.update({
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      await sleep(1000);
    }

    console.log(`Registered ${count} books.`);
  });
