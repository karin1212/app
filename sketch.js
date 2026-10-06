// ---------- 素材 ----------
let backgroundImg;
let firewoodImg;
let fireImg;
let bearImg;
let rabbitImg;
let catImg;
let dogImg;
let marshmallowImg;
let myHandImg;
let otherUsers;

let marshmallowX;
let marshmallowY;
let marshmallowAngle;

let topBackgroundImg;
let finishBackgroundImg;

// ---------- 音 ----------
let campfireSound;
let soundButton;

// ---------- 画面 ----------
let screen = 'top';
let startButton;
let endButton;
let retryButton;
let returnButton;

// ---------- タスク ----------
let taskInput;
let taskName;

// ---------- タイマー ----------
const workTime = 5 * 60; // 5分
let startTime;
//let finished = false;
let elapsedTime = 0;
let totalWorkTime = 0; // 累計作業時間（秒）
let completedCount = 0; // 終了したセット数
let completedThisRound = false; //達成処理を1回だけ行うための変数
let showCompleteMessage = false;

// ---------- 左下のカウント ----------
let marshmallowCount = 0;

// ＋1演出用
let showMarshmallowEffect = false;
let marshmallowEffectStart = 0;

// ---------- 時間経過で入退室 ----------
let lastChangeTime = 0;
let changeInterval = 30000; // 10秒

// ---------- 通知 ----------
let notificationText = '';
let notificationStartTime = 0;
let notificationDuration = 3000;

//アニメーション
let sparks = [];

// ---------- p5 ----------
function preload() {
  backgroundImg = loadImage('assets/background.png');

  bearImg = loadImage('assets/bear.png');
  rabbitImg = loadImage('assets/rabbit.png');
  catImg = loadImage('assets/cat.png');
  dogImg = loadImage('assets/dog.png');

  firewoodImg = loadImage('assets/wood.png');
  fireImg = loadImage('assets/fire.png');

  marshmallowImg = loadImage('assets/marshmallow_l.png');
  myHandImg = loadImage('assets/hand.png');

  campfireSound = loadSound('assets/campfire.mp3');

  topBackgroundImg = loadImage('assets/top.png');
  finishBackgroundImg = loadImage('assets/finish.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  imageMode(CENTER);

  // タスク入力欄
  taskInput = createInput();
  taskInput.attribute('placeholder', '取り組むタスクを宣言しよう！');

  taskInput.position(width / 2 - 150, height * 0.59);
  taskInput.size(300, 40);

  //トップ画面のボタン
  startButton = createButton('5分だけやってみる');
  startButton.position(width / 2 - 110, height * 0.59 + 75);
  startButton.size(220, 50);
  startButton.mousePressed(() => {
    screen = 'work';
    startTime = millis();
    startButton.hide();
    taskName = taskInput.value();

    totalWorkTime = 0;
    completedCount = 0;
    marshmallowCount = 0;
    elapsedTime = 0;
    completedThisRound = false;
    startSound();
  });

  // 作業終了ボタン
  endButton = createButton('作業を終了する');

  endButton.position(width - 210, height - 72);
  endButton.size(180, 45);

  endButton.mousePressed(() => {
    totalWorkTime += elapsedTime;
    screen = 'finish';
    endButton.hide();
    campfireSound.stop();
    soundButton.html('🔇 音を流す');
  });

  //リトライボタン
  retryButton = createButton('もう5分やる');

  retryButton.position(width / 2 - 240, height * 0.68);
  retryButton.size(220, 50);

  retryButton.mousePressed(() => {
    screen = 'work';
    startTime = millis(); // ← ここでタイマーをリセット
    retryButton.hide();
    startSound();
  });

  //トップ画面に戻るボタン
  returnButton = createButton('トップ画面に戻る');
  returnButton.position(width / 2 + 20, height * 0.68);
  returnButton.size(220, 50);

  returnButton.mousePressed(() => {
    screen = 'top';
    returnButton.hide();
  });

  // ---------- 他ユーザー ----------
  otherUsers = [
    {
      name: 'クマさん',
      image: bearImg,
      task: 'レポートを書く',
      active: true,
      id: 1,
      depth: 'back'
    },
    {
      name: 'ウサギさん',
      image: rabbitImg,
      task: 'プログラミングの勉強',
      active: true,
      id: 2,
      depth: 'back'
    },
    {
      name: 'ネコさん',
      image: catImg,
      task: '読書',
      active: false,
      id: 3,
      depth: 'front'
    },
    {
      name: 'イヌさん',
      image: dogImg,
      task: '課題を進める',
      active: false,
      id: 4,
      depth: 'front'
    }
  ];

  // 作業開始
  startTime = millis();

  marshmallowX = width / 2;
  marshmallowY = height - 250;
  marshmallowAngle = 0;

  // 音ボタン
  soundButton = createButton('🔇 音を流す');
  soundButton.position(width - 210, height - 120);
  soundButton.size(180, 45);
  soundButton.mousePressed(toggleSound);

  setupSparks();
}

function draw() {
  if (screen === 'top') {
    startButton.show();
    taskInput.show();
    endButton.hide();
    retryButton.hide();
    returnButton.hide();
    soundButton.hide();
    drawTopScreen();
  } else if (screen === 'work') {
    endButton.show();
    retryButton.hide();
    returnButton.hide();
    soundButton.show();
    taskInput.hide();
    drawWorkScreen();
  } else if (screen === 'finish') {
    endButton.hide();
    retryButton.show();
    returnButton.show();
    taskInput.hide();
    soundButton.hide();
    drawFinishedScreen();
  }
}

//==============================
//トップ画面
//==============================
function drawTopScreen() {
  // 背景
  drawBackground(topBackgroundImg);

  // メッセージ
  fill(241, 229, 200);

  textAlign(CENTER, CENTER);

  textSize(100);

  text('Focus Camp', width / 2, height * 0.15);
}

//==============================
//作業画面
//==============================

function drawWorkScreen() {
  elapsedTime = floor((millis() - startTime) / 1000);
  if (elapsedTime >= workTime && !completedThisRound) {
    totalWorkTime += workTime;
    completedCount++;
    showCompleteMessage = true;
    completedThisRound = true;

    // マシュマロを1個焼いた
    marshmallowCount++;

    // ＋1演出を開始
    showMarshmallowEffect = true;
    marshmallowEffectStart = millis();

    startNextRound();
  }

  updateUsers();

  // 1. 背景
  drawBackground(backgroundImg);

  // 2. 他ユーザー
  drawUsers();

  // 3. 焚き火
  drawFirewood();
  drawFire();
  drawSparks(width * 0.5, height * 0.61);

  // 4. 自分のマシュマロ
  drawMyStick();
  drawMyHand();
  drawMyMarshmallow();

  // 5. UI
  drawTopUI();
  drawTimer();
  drawTaskUI();
  //drawEndButton();

  // ==============================
  // 6. 5分終了
  // ==============================

  if (getRemainingTime() <= 0 && !finished) {
    screen = 'finish';
  }

  if (showCompleteMessage) {
    drawCompleteMessage();
    /*fill('#F1E5C8');
    textAlign(CENTER, CENTER);
    textSize(25);
    text('5分達成！', width / 2, height * 0.25);*/
  }

  // 左下のカウント
  drawMarshmallowCount();
  // ＋1演出
  drawMarshmallowEffect();

  // 通知
  drawNotification();
}

// =================================
// 背景
// =================================

function drawBackground(img) {
  imageMode(CENTER);
  image(img, width / 2, height / 2, width, height);
  //imageMode(CORNER);
}

// 他ユーザー
/*function drawUsers() {
  let s = min(width / 1100, height / 700);

  // クマ
  drawCharacter(bearImg, width * 0.3, height * 0.5, 0.65 * s, 0.65 * s, 1);
  drawUserStick(width * 0.35, height * 0.43, 0.3);
  drawUserMarshmallow(width * 0.343, height * 0.48, 0.3);

  // ウサギ
  drawCharacter(rabbitImg, width * 0.68, height * 0.48, 0.65 * s, 0.65 * s, 2);
  drawUserStick(width * 0.632, height * 0.42, -0.3);
  drawUserMarshmallow(width * 0.64, height * 0.47, -0.3);

  // ネコ
  drawCharacter(catImg, width * 0.3, height * 0.68, 0.65 * s, 0.65 * s, 3);
  drawUserStick(width * 0.348, height * 0.6, 0.3);
  drawUserMarshmallow(width * 0.341, height * 0.65, 0.3);

  // イヌ
  drawCharacter(dogImg, width * 0.68, height * 0.67, 0.65 * s, 0.65 * s, 4);
  drawUserStick(width * 0.628, height * 0.58, -0.3);
  drawUserMarshmallow(width * 0.636, height * 0.63, -0.3);
}*/

function drawOtherUser(user, index) {
  let s = min(width / 1100, height / 700);

  let positions = [
    {
      x: width * 0.3,
      y: height * 0.5,
      stickX: width * 0.35,
      stickY: height * 0.43,
      marshmallowX: width * 0.343,
      marshmallowY: height * 0.48,
      direction: 0.3,
      depth: 'back'
    },
    {
      x: width * 0.68,
      y: height * 0.48,
      stickX: width * 0.632,
      stickY: height * 0.42,
      marshmallowX: width * 0.64,
      marshmallowY: height * 0.47,
      direction: -0.3,
      depth: 'back'
    },
    {
      x: width * 0.3,
      y: height * 0.68,
      stickX: width * 0.348,
      stickY: height * 0.6,
      marshmallowX: width * 0.341,
      marshmallowY: height * 0.65,
      direction: 0.3,
      depth: 'front'
    },
    {
      x: width * 0.68,
      y: height * 0.67,
      stickX: width * 0.628,
      stickY: height * 0.58,
      marshmallowX: width * 0.636,
      marshmallowY: height * 0.63,
      direction: -0.3,
      depth: 'front'
    }
  ];

  let pos = positions[index];

  // 動物
  drawCharacter(user.image, pos.x, pos.y, 0.65 * s, 0.65 * s, user.id);

  // 棒
  drawUserStick(pos.stickX, pos.stickY, pos.direction);

  // マシュマロ
  drawUserMarshmallow(pos.marshmallowX, pos.marshmallowY, pos.direction);

  // タスクバブル
  if (pos.depth === 'back') {
    drawTaskBubble(user, pos.x, pos.y - 120, false);
  } else {
    drawTaskBubble(user, pos.x, pos.y + 120, true);
  }
}

function drawUsers() {
  for (let i = 0; i < otherUsers.length; i++) {
    if (otherUsers[i].active) {
      drawOtherUser(otherUsers[i], i);
    }
  }
}

// =================================
// タスクバブル
// =================================
function drawTaskBubble(user, x, y, isBack) {
  let bubbleWidth = 190;
  let bubbleHeight = 48;

  push();

  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(14);

  fill(255, 248, 225);
  stroke(100, 75, 50);
  strokeWeight(2);
  rect(x, y, bubbleWidth, bubbleHeight, 12);

  // 吹き出しのしっぽ
  fill(255, 248, 225);
  noStroke();

  if (isBack) {
    // 上向き
    triangle(x - 12, y - bubbleHeight / 2 + 2, x + 12, y - bubbleHeight / 2 + 2, x, y - bubbleHeight / 2 - 14);
  } else {
    // 下向き
    triangle(x - 12, y + bubbleHeight / 2 - 2, x + 12, y + bubbleHeight / 2 - 2, x, y + bubbleHeight / 2 + 14);
  }

  // タスク文字
  fill(70, 50, 40);
  text(user.task, x, y);

  pop();
}

// =================================
// 動物
// =================================

function drawCharacter(img, x, y, scaleX, scaleY, id) {
  // ゆっくり上下に動かす
  let movement = sin(frameCount * 0.025 + id) * 3;

  image(img, x, y + movement, img.width * scaleX, img.height * scaleY);
}

//================================
// ユーザーの状態更新
//================================

function updateUsers() {
  if (millis() - lastChangeTime > changeInterval) {
    changeUserStatus();
    lastChangeTime = millis();
  }
}

function changeUserStatus() {
  let index = floor(random(otherUsers.length));
  let user = otherUsers[index];

  // 入室・退室を切り替える
  user.active = !user.active;

  // 状態に合わせて通知を表示
  if (user.active) {
    showNotification(user.name + 'が入室しました');
  } else {
    showNotification(user.name + 'が退室しました');
  }
}

// =================================
// 通知
// =================================
function showNotification(text) {
  notificationText = text;
  notificationStartTime = millis();
}

function drawNotification() {
  if (notificationText === '') return;

  let elapsed = millis() - notificationStartTime;

  if (elapsed > notificationDuration) {
    notificationText = '';
    return;
  }

  push();

  rectMode(CENTER);
  noStroke();
  fill(70, 50, 40, 220);
  rect(width / 2, 220, 360, 55, 15);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(notificationText, width / 2, 220);

  pop();
}

// =================================
// 焚き火
// =================================

function drawFirewood() {
  image(firewoodImg, width * 0.5, height * 0.61, 180, 100);
}

function drawFire() {
  drawFireAnimated(width * 0.5, height * 0.51, 130, 150);
}

// =================================
// 自分の手
// =================================

function drawMyHand() {
  push();
  imageMode(CORNER);

  let handW = 150;
  let handH = 220;

  image(myHandImg, width / 2 - handW / 2, height - handH + 80, handW, handH);

  pop();
}

/*function drawMyHand() {
  push();
  translate(marshmallowX, marshmallowY);
  rotate(marshmallowAngle);

  image(myHandImg, -75, 50, 150, 220);

  pop();
}*/

// ------------------------------
// マシュマロ
// ------------------------------

function drawMyStick() {
  push();

  translate(marshmallowX, marshmallowY);
  rotate(marshmallowAngle);

  stroke(90, 65, 50);
  strokeWeight(10);
  line(0, 50, 0, 130);

  pop();
  // 棒を描く
}

function drawMyMarshmallow() {
  push();

  translate(marshmallowX, marshmallowY);
  rotate(marshmallowAngle);

  // 経過時間から焼き加減を計算
  let progress = constrain(elapsedTime / workTime, 0, 1);

  // 白 → 黄色 → 茶色へ変化
  let marshmallowColor;

  if (progress < 0.4) {
    marshmallowColor = lerpColor(color('#F5F0E1'), color('#E7C875'), progress / 0.4);
  } else {
    marshmallowColor = lerpColor(color('#E7C875'), color('#9A542F'), (progress - 0.4) / 0.6);
  }

  noStroke();
  fill(marshmallowColor);
  rectMode(CENTER);
  rect(0, 20, 60, 95, 30);

  pop();
  // マシュマロを描く
}

/*push();

  imageMode(CENTER);

  image(marshmallowImg, x, y, marshmallowImg.width * 0.18 * s, marshmallowImg.height * 0.18 * s);

  // 焼け具合の色を重ねる
  if (progress > 0.3) {
    let brownAlpha = map(progress, 0.3, 1, 0, 130);

    fill(120, 75, 35, brownAlpha);
    noStroke();

    ellipse(x, y, marshmallowImg.width * 0.13 * s, marshmallowImg.height * 0.13 * s);
  }

  pop();
}*/

// =================================
//他ユーザーのマシュマロ
// =================================

function drawUserStick(x, y, angle) {
  push();

  translate(x, y);
  rotate(angle);

  stroke(90, 65, 50);
  strokeWeight(10);
  line(0, 50, 0, 100);

  pop();
  // 棒を描く
}

function drawUserMarshmallow(x, y, angle) {
  push();

  translate(x, y);
  rotate(angle);

  noStroke();
  fill(245, 240, 225);
  rectMode(CENTER);
  rect(0, 0, 20, 35, 12);

  pop();
}

// =================================
// 上部UI
// =================================

function drawTopUI() {
  // 左上
  fill(241, 229, 200);
  noStroke();

  textAlign(LEFT, TOP);
  textSize(24);

  text('🔥 Focus Camp', 35, 30);

  // 作業人数
  fill(216, 199, 165);
  textSize(16);

  text('4人が集中しています', 38, 62);
}

// =================================
// タイマー
// =================================

function drawTimer() {
  let remaining = getRemainingTime();

  let minutes = floor(remaining / 60);

  let seconds = remaining % 60;

  let timeText = nf(minutes, 2) + ':' + nf(seconds, 2);

  fill(241, 229, 200);
  noStroke();

  textAlign(CENTER, CENTER);

  textSize(min(width, height) * 0.055);

  text(timeText, width * 0.5, height * 0.16);
}

// =================================
// 残り時間
// =================================

function getRemainingTime() {
  let elapsed = floor((millis() - startTime) / 1000);

  return max(0, workTime - elapsed);
}

// =================================
// タスク
// =================================

function drawTaskUI() {
  let boxWidth = min(width * 0.42, 500);

  let boxHeight = 55;

  let x = width / 2;
  let y = height * 0.08;

  // 背景
  fill(35, 23, 13, 220);
  noStroke();

  rectMode(CENTER);

  rect(x, y, boxWidth, boxHeight, 12);

  // タスク
  fill(241, 229, 200);

  textAlign(CENTER, CENTER);
  textSize(18);

  text(taskName, x, y);
}

// =================================
//達成時間表示
// =================================
function drawCompleteMessage() {
  let totalMinutes = totalWorkTime / 60;

  fill('#F1E5C8');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(25);

  text(totalMinutes + '分達成！', width / 2, height * 0.25);
}

// =================================
// ＋1演出
// =================================

function drawMarshmallowEffect() {
  if (!showMarshmallowEffect) return;

  let elapsed = millis() - marshmallowEffectStart;
  let duration = 1500;

  if (elapsed >= duration) {
    showMarshmallowEffect = false;
    return;
  }

  let progress = elapsed / duration;

  // 最初にぴょんと上がって、その後少し下がる
  let jumpY;

  if (progress < 0.35) {
    // 上に跳ねる
    let jumpProgress = progress / 0.35;
    jumpY = -sin((jumpProgress * PI) / 2) * 25;
  } else {
    // 少し下がって元の位置に戻る
    let fallProgress = (progress - 0.35) / 0.65;
    jumpY = -25 + sin((fallProgress * PI) / 2) * 25;
  }

  // 最後にふわっと消える
  let alpha = 255;

  if (progress > 0.65) {
    alpha = map(progress, 0.65, 1, 255, 0);
  }

  push();

  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  // 「5分達成！」のすぐ下
  let messageY = height / 2 + 45;

  fill(255, 235, 170, alpha);
  textSize(24);

  text('+1 マシュマロ！', width / 2, messageY + jumpY);

  pop();
}

// =================================
// 左下のマシュマロカウント
// =================================
function drawMarshmallowCount() {
  push();

  imageMode(CORNER);
  image(marshmallowImg, 35, height - 85, 50, 50);

  textAlign(LEFT, CENTER);
  textSize(22);
  textStyle(BOLD);
  fill(255);

  text('× ' + marshmallowCount, 95, height - 60);

  pop();
}

// =================================
// 次のラウンド開始
// =================================
function startNextRound() {
  startTime = millis();
  elapsedTime = 0;
  completedThisRound = false;
}

// =================================
// 作業終了ボタン
// =================================

/*function drawEndButton() {
  let buttonWidth = 180;
  let buttonHeight = 45;

  let x = width - 120;
  let y = height - 50;

  fill(121, 80, 37);
  noStroke();

  rectMode(CENTER);

  rect(x, y, buttonWidth, buttonHeight, 10);

  fill(241, 229, 200);

  textAlign(CENTER, CENTER);
  textSize(15);

  text('作業を終了する', x, y);
}*/

// =================================
// 5分終了画面
// =================================

function drawFinishedScreen() {
  // 背景
  drawBackground(finishBackgroundImg);

  // メッセージ
  fill('#795025');
  textAlign(CENTER, CENTER);

  textSize(45);
  text('5分間、おつかれさま！', width / 2, height * 0.35);

  textSize(25);
  text('マシュマロがこんがり焼けました 🔥', width / 2, height * 0.42);

  // 作業結果
  /*imageMode(CORNER);
  image(marshmallowImg, width / 2, height * 0.52, 50, 50);
  textSize(40);
  text(' 焼いたマシュマロ：' + completedCount + '個', width / 2, height * 0.52);*/

  textSize(30);

  let textContent = '焼いたマシュマロ：' + completedCount + '個';
  let messageWidth = textWidth(textContent);

  let imageSize = 30;
  let gap = 8;

  let totalWidth = imageSize + gap + messageWidth;
  let startX = width / 2 - totalWidth / 2;

  // マシュマロ画像
  image(marshmallowImg, startX + imageSize / 2, height * 0.533 - imageSize / 2, imageSize, imageSize);

  // 文字
  text(textContent, startX + imageSize + gap + messageWidth / 2, height * 0.52);

  let minutes = floor(totalWorkTime / 60);
  let seconds = totalWorkTime % 60;

  text('⏱ 作業時間：' + minutes + '分' + seconds + '秒', width / 2, height * 0.58);
}

// =================================
// 画面サイズ変更
// =================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// =================================
// 音
// =================================
function startSound() {
  if (!campfireSound.isPlaying()) {
    campfireSound.loop();
    campfireSound.setVolume(0.2);
    soundButton.html('🔊 音を止める');
  }
}

function toggleSound() {
  if (campfireSound.isPlaying()) {
    campfireSound.stop();
    soundButton.html('🔇 音を流す');
  } else {
    startSound();
  }
}

// =================================
// 焚き火アニメーション
// =================================
function drawFireAnimated(x, y, w, h) {
  let t = millis() * 0.005;

  let scaleX = 1 + sin(t) * 0.04;
  let scaleY = 1 + sin(t * 1.3) * 0.06;

  push();
  imageMode(CENTER);
  translate(x, y);
  scale(scaleX, scaleY);
  image(fireImg, 0, 0, w, h);
  pop();
}

function setupSparks() {
  for (let i = 0; i < 12; i++) {
    sparks.push({
      x: random(-25, 25),
      y: random(0, 20),
      speed: random(0.3, 0.8),
      size: random(2, 5),
      alpha: random(100, 220)
    });
  }
}

function drawSparks(x, y) {
  push();
  noStroke();

  for (let spark of sparks) {
    spark.y -= spark.speed;

    if (spark.y < -70) {
      spark.y = random(0, 20);
      spark.x = random(-25, 25);
    }

    fill(255, 210, 100, spark.alpha);
    circle(x + spark.x, y + spark.y, spark.size);
  }

  pop();
}
