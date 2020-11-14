## データを追加する

単一のドキュメントを追加または上書きする場合 `set()` メソッドを使う。
```typescript
const data = {
  address: '鹿沼市',
  age: 14 
};

const res = await db.collection('users').doc('machamp').set(data);
```
`set()` を使う時、ドキュメントのIDを指定する必要があります。
ただし、ドキュメントに有効なIDがなく、firestoreが自動的にIDを生成した方が
いい場合もあり、その時は `add()` を利用します。


## データ型

Firestoreには以下のデータ型が存在する。
```typescript
const data = {
  stringExample: 'Hello, World!', // 文字列
  booleanExample: true, // 真偽
  numberExample: 3.14159265, // 数値
  dateExample: admin.firestore.Timestamp.fromDate(new Date('December 10, 1815')), // 日付
  arrayExample: [5, true, 'hello'], // 配列
  nullExample: null, // null
  objectExample: { // オブジェクト
    a: 5,
    b: true
  }
};
```

## ドキュメントを更新する

ドキュメント全体を上書きせずに、一部のみ更新する場合、`update()` が利用できます。
```typescript
const cityRef = db.collection('cities').doc('DC');

// Set the 'capital' field of the city
const res = await cityRef.update({capital: true});
```

## タイムスタンプ

ドキュメントのフィールドにタイムスタンプを設定できます。
```typescript
// Get the `FieldValue` object
const FieldValue = admin.firestore.FieldValue;

// Create a document reference
const docRef = db.collection('objects').doc('some-id');

// Update the timestamp field with the value from the server
const res = await docRef.update({
  timestamp: FieldValue.serverTimestamp()
});
```

## 数値を増やす

```typescript
const admin = require('firebase-admin');
// ...
const washingtonRef = db.collection('cities').doc('DC');

// Atomically increment the population of the city by 50.
const res = await washingtonRef.update({
  population: admin.firestore.FieldValue.increment(50)
});
```
`increment` は便利ですが、１つのドキュメントを更新できる回数は１秒間に１回だけ
なので注意が必要です。
