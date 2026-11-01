# クラウド同期の設定（shoshi-ox × shoshi-progress）

択一（このアプリ）と進捗（shoshi-progress）で **Firebase プロジェクトは1つ** です。無料の Spark プラン（Authentication と Cloud Firestore）で足ります。2つ目のプロジェクトは作らないでください。

このアプリが読む・書く場所は次だけです。

```text
users/{uid}/ox/state
```

`{uid}` は Google ログイン後の Firebase Auth のユーザー ID です。進捗アプリは同じユーザーの下に、別の場所を使ってください。

```text
users/{uid}/progress/...
```

択一の画面から `progress` は読み書きしません。進捗の画面から `ox` は読み書きしないでください。あとから種類を増やすときは、`users/{uid}/ox/` の中に文書を足します（いまの本体は `state` の1件です）。

両方のサイトは同じホスト `tanatos0209.github.io` です（パスだけ `/shoshi-ox/` と `/shoshi-progress/`）。許可ドメインは **この1つ** で両方に効きます。同じ Web アプリの鍵を両方の `firebase-config.js` に入れると、ログイン状態もこのオリジンで共有されます。

## 1. Firebase コンソール

1. https://console.firebase.google.com/ でプロジェクトを1つ作る（すでにある進捗用のプロジェクトがあれば、それを開く）。
2. **Authentication → Sign-in method → Google** を有効にする。
3. **Authentication → Settings → Authorized domains** に次を入れる。
   - `tanatos0209.github.io`
   - `localhost`（最初から入っていることが多い。ローカル確認用）
4. **Build → Firestore Database** を作る。ロケーションは一度きりなので、進捗アプリと相談して決める（例: `asia-northeast1`）。本番モードで作ってから、下のルールを貼る。
5. **Project settings → General → Your apps → Web** で Web アプリを1つ追加する（`</>`）。このアプリ用にもう1つ作ってもよいが、鍵は同じプロジェクトのものであること。

Spark（無料）の目安: Authentication の Google ログインは無料。Firestore は1日のおおよその無料枠が読み取り 5万・書き込み 2万・削除 2万です。一人の学習記録ならこの枠に収まります。

## 2. 鍵を firebase-config.js に入れる

コンソールの Web アプリ設定を、リポジトリ直下の `firebase-config.js` に貼ります。進捗アプリにも **同じ値** を置きます。ファイル名は同じにしてください。

```javascript
window.SHOSHI_FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

`storageBucket` が `YOUR_PROJECT.firebasestorage.app` の場合は、コンソールの表示をそのまま使います。

この鍵はブラウザに出ます。Firebase の Web 鍵は秘密情報ではありません。守るのは許可ドメインと、下のルールです。空文字のままならログインボタンは出さず、この端末だけに保存します。

`main` に載せて GitHub Pages に出すと、https://tanatos0209.github.io/shoshi-ox/ からその鍵でログインできます。鍵を変えたあとは、ホームを引き下げて再読み込みします（`firebase-config.js` はネットワーク優先です）。

## 3. Firestore のルール

Firestore → Rules に貼って公開します。自分の `users/{uid}` 以下だけ、ログイン中の本人が読み書きできます。`ox` も `progress` もこの1枚で足ります。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

同じ内容を `firestore.rules` に置いてあります。

## 4. アプリ側の動き

- ホーム右上の人アイコン、または設定の「クラウド同期」。
- 未設定: 「鍵が未設定です」。学習はそのままこの端末に残ります。
- ログイン前: 「Googleでログイン」。ポップアップが使えないときはリダイレクトに切り替えます。
- ログイン後: メール、同期の状態、「今すぐ同期」、「ログアウト」。ログアウトしても端末の記録は消しません。
- 人アイコンが金色のときはログイン済みです。
- 記録はいつも先に localStorage（`shoshi-ox-v1`）へ書きます。オフラインでも解答・絞り込み・目標の変更ができます。
- オンラインに戻ると `users/{uid}/ox/state` と突き合わせます。文書の `updatedAt` が新しい方の目標・絞り込み・連続日数を採用します。問題ごとの SRS（理解度・次回復習・間隔）は、その問題の解答時刻が新しい方です。解答ログは両方残します。
- 進行中の出題画面（いま開いている問）は送りません。解答そのものは、○×を押した時点で履歴に入っています。
- 問題文の印と手書きメモは localStorage に置きません。同期しません。画面を離れると消えます。
- `shoshi-ox-` で始まる別の localStorage キーは、同じ文書の `extras` に載せます。学習記録のうち、この版が知らない項目を落とさないためです。1MB を超える追加データはクラウドに載せず、この端末に残します。学習記録本体は送ります。

## 5. ローカル確認

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

http://127.0.0.1:8765/ を開きます。`localhost` が許可ドメインに入っていて、`firebase-config.js` に鍵があれば、ここで Google ログインまで確認できます。鍵が空でも、択一・履歴・絞り込みは今までどおり動きます。

マージだけ見る場合:

```bash
node --test test/sync-merge.test.js
```
