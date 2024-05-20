const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/data/youxue1.db');
const PriorityQueue = require('./PriorityQueue.js');
db.serialize(function () {
  db.run("CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS Diaries (id INTEGER PRIMARY KEY, diary TEXT, code TEXT, authorId INTEGER, viewCount INTEGER DEFAULT 0, rating REAL DEFAULT 0, ratingCount INTEGER DEFAULT 0)"); // 在Diaries表中添加code列
});

function checkUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM Users WHERE username = ?", [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.id : null);
      }
    });
  });
}

function addUser(username, password) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO Users (username, password) VALUES (?, ?)", [username, password], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

function login(username, password) {
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM Users WHERE username = ? AND password = ?", [username, password], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.id : null);
      }
    });
  });
}


function rateDiary(diaryId, rating) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE Diaries SET rating = (rating * ratingCount + ?) / (ratingCount + 1), ratingCount = ratingCount + 1 WHERE id = ?", [rating, diaryId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}

function addDiary(diary, authorId) {
  return new Promise((resolve, reject) => {
    let [compressedDiary, code] = huffmanCompress(diary);
    db.run("INSERT INTO Diaries (diary, code, authorId) VALUES (?, ?, ?)", [compressedDiary, code, authorId], function(err) { // 在数据库中存储压缩后的日记和哈夫曼编码表
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}


function huffmanDecompress(compressed, decode) {
  let decompressed = '';
  let temp = '';
  decode = JSON.parse(decode); // 将decode字符串解析为对象
  for (let i = 0; i < compressed.length; i++) {
      temp += compressed[i];
      if (decode[temp]) {
          decompressed += decode[temp];
          temp = '';
      }
  }
  return decompressed;
}



function getDiaries() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Diaries", [], (err, rows) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        for (let i = 0; i < rows.length; i++) {
          rows[i].diary = huffmanDecompress(rows[i].diary, rows[i].code); // 使用哈夫曼编码表解压缩日记
        }
        resolve(rows);
      }
    });
  });
}

function viewDiary(diaryId) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE Diaries SET viewCount = viewCount + 1 WHERE id = ?", [diaryId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}

function huffmanCompress(diary) {
  let freq = {};
  for (let i = 0; i < diary.length; i++) {
      if (diary[i] in freq) {
          freq[diary[i]]++;
      } else {
          freq[diary[i]] = 1;
      }
  }

  if (Object.keys(freq).length === 1) {
      return [Object.keys(freq)[0].repeat(diary.length), JSON.stringify({ [Object.keys(freq)[0]]: '0' })];
  }

  let heap = new PriorityQueue((a, b) => a[0] < b[0]);
  for (let char in freq) {
      heap.enqueue([freq[char], char]);
  }

  while (heap.size() > 1) {
      let lo = heap.dequeue();
      let hi = heap.dequeue();
      if (lo[1] === undefined || hi[1] === undefined) {
          throw new Error('Unexpected undefined value in heap');
      }
      let loChar = lo[1];
      let hiChar = hi[1];
      if (Array.isArray(loChar))
          heap.enqueue([lo[0] + hi[0], [loChar, hiChar]]);
      else
          heap.enqueue([lo[0] + hi[0], [hiChar, loChar]]);
  }
  // 在 huffmanCompress 函数中
  let root = heap.peek();
  if (!Array.isArray(root) || root[1] === undefined) {
      throw new Error('Unexpected root value in heap');
  }
  let code = buildCode(root[1]);
  function buildCode(tree, prefix = '') {

      if (typeof (tree) === "string") {
          return { [tree]: prefix };
      } else {
          return Object.assign(buildCode(tree[0], prefix + '0'), buildCode(tree[1], prefix + '1'));
      }
  }


  let compressed = '';
  let decode = {};
  for (let i = 0; i < diary.length; i++) {
      compressed += code[diary[i]];
      decode[code[diary[i]]] = diary[i]; // 创建解码表
  }

  return [compressed,  JSON.stringify(decode)]; // 返回压缩后的日记、哈夫曼解码表
}

function getRecommendedDiaries() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Diaries", [], (err, rows) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        for (let i = 0; i < rows.length; i++) {
          rows[i].diary = huffmanDecompress(rows[i].diary, rows[i].code); // 使用哈夫曼编码表解压缩日记
        }
        // 使用冒泡排序算法对游学日记进行排序
        for (let i = 0; i < rows.length - 1; i++) {
          for (let j = 0; j < rows.length - 1 - i; j++) {
            if (rows[j].viewCount < rows[j + 1].viewCount ||
              (rows[j].viewCount === rows[j + 1].viewCount && rows[j].rating < rows[j + 1].rating)) {
              let temp = rows[j];
              rows[j] = rows[j + 1];
              rows[j + 1] = temp;
            }
          }
        }
        resolve(rows);
      }
    });
  });
}


module.exports = {
  checkUsername,
  addUser,
  login,
  getDiaries,
  rateDiary,
  addDiary,
  viewDiary,
  getRecommendedDiaries 
};
