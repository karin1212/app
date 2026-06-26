// === p5.js：3画面切り替え式・5分間目標共有タイマー ===

let taskInput;
let startButton;
let restartButton; // ★追加：もう一度ボタン

// 画面の状態を管理する変数（0: タイトル, 1: タイマー, 2: 終了）
let scene = 0;

let myTimer = 0;
let myTaskText = '';
let totalDuration = 5 * 60 * 60; // 5分間（18000フレーム）

let otherTasks = [];
let rainNoise;
let rainFilter;
let bgImage;

function preload() {
  // 焚き火画像の読み込み
  bgImage = loadImage('fire.jpg');
}

// 他のユーザーのタスククラス
class OtherUserTask {
  constructor(text, isInitial = false) {
    this.text = text;
    this.timer = totalDuration;
    this.x = random(50, width - 150);

    // ★改善：最初からいる人はランダムな高さ、途中で入る人は一番下（height）から出現
    if (isInitial) {
      this.timer = random(1000, totalDuration);
    }
  }

  update() {
    this.timer--;
  }

  display() {
    let progress = (totalDuration - this.timer) / totalDuration;
    let y = lerp(height + 20, 50, progress); // 画面の下からせり上がる

    let otherOffset = sin(frameCount * 0.01 + this.x) * 12;
    let finalX = this.x + otherOffset;

    // 文字の縁取り（チャプター03の応用：視覚的な読みやすさ向上）
    stroke(0, 0, 0, 150);
    strokeWeight(3);
    fill(150, 200, 255, 180);
    textSize(14);
    text('👤 ' + this.text, finalX, y);

    // 残り秒数
    let timeLeftSec = Math.ceil(this.timer / 60);
    noStroke();
    textSize(10);
    fill(200, 200, 200, 130);
    text(timeLeftSec + 's', this.x, y + 15);
  }

  isFinished() {
    return this.timer <= 0;
  }
}

function setup() {
  createCanvas(600, 500);

  // HTML要素の作成と配置
  let controlDiv = createDiv();
  controlDiv.position(10, height + 10);

  taskInput = createInput('');
  taskInput.parent(controlDiv);
  taskInput.attribute('placeholder', '今から5分間でやることを入力');
  taskInput.size(250);

  startButton = createButton('オンラインで開始宣言！');
  startButton.parent(controlDiv);
  startButton.mousePressed(startMyTimer);

  // もう一度ボタン（最初は非表示にしておく）
  restartButton = createButton('もう一度作業する');
  restartButton.parent(controlDiv);
  restartButton.mousePressed(backToTitle);
  restartButton.hide();

  // 環境音のセットアップ
  rainNoise = new p5.Noise('pink');
  rainNoise.amp(0);
  rainFilter = new p5.LowPass();
  rainNoise.disconnect();
  rainNoise.connect(rainFilter);
  rainNoise.start();

  // 初期メンバーの生成
  let sampleTasks = ['読書する', '英単語 暗記', '部屋の片付け'];
  for (let i = 0; i < 3; i++) {
    otherTasks.push(new OtherUserTask(random(sampleTasks), true));
  }
}

function draw() {
  // 全画面共通の背景描画
  background(bgImage);
  fill(0, 0, 0, 130);
  rect(0, 0, width, height);

  // 背景の雨エフェクト
  drawRainEffect();

  // 他のユーザーの更新と描画（タイマー中と終了画面でも動かし続ける）
  updateOtherTasks();

  // ★チャプター11：変数 scene の値によって画面を切り替える
  if (scene === 0) {
    drawTitleScene();
  } else if (scene === 1) {
    drawTimerScene();
  } else if (scene === 2) {
    drawEndScene();
  }

  // 上部のオンラインヘッダー
  drawHeader();
}

// --- 各画面の描画関数 ---

// 0: タイトル画面
function drawTitleScene() {
  taskInput.show();
  startButton.show();
  restartButton.hide();

  fill(250);
  noStroke();
  textSize(22);
  textAlign(CENTER, CENTER);
  text('焚き火コワーキングタイマー', width / 2, height / 2 - 40);

  textSize(14);
  fill(180);
  text('5分間の集中目標を入力して\n「開始宣言」ボタンを押してください。', width / 2, height / 2 + 20);
}

// 1: タイマー画面
function drawTimerScene() {
  taskInput.hide();
  startButton.hide();

  myTimer--;

  // 縦位置と横のゆっくりゆらゆら
  let myProgress = (totalDuration - myTimer) / totalDuration;
  let myY = lerp(height - 50, 50, myProgress);
  let offsetWithSin = sin(frameCount * 0.02) * 20;
  let myX = width / 2 + offsetWithSin;

  // 自分の目標（黒い縁取りでくっきり見やすく）
  stroke(0);
  strokeWeight(4);
  fill(255, 204, 0);
  textSize(22);
  textAlign(CENTER, CENTER);
  text('🔥 ' + myTaskText, myX, myY);

  // 残り時間（分：秒）
  let remainingSeconds = Math.ceil(myTimer / 60);
  let displayMin = Math.floor(remainingSeconds / 60);
  let displaySec = remainingSeconds % 60;
  let timeString = nf(displayMin, 2) + ':' + nf(displaySec, 2);

  noStroke();
  textSize(16);
  fill(255, 255, 255, 220);
  text(timeString, width / 2, myY + 30);

  // 雨音をフェードイン再生
  rainNoise.amp(0.15, 0.5);
  rainFilter.freq(800);

  // 5分経過したら終了画面（scene = 2）へ
  if (myTimer <= 0) {
    scene = 2;
  }
}

// 2: 終了画面
function drawEndScene() {
  restartButton.show(); // もう一度ボタンを表示

  // ★改善：雨音を1.5秒かけて静かにフェードアウトさせる
  rainNoise.amp(0, 1.5);

  stroke(0);
  strokeWeight(4);
  fill(0, 255, 150); // 達成感のあるグリーン
  textSize(26);
  textAlign(CENTER, CENTER);
  text('🎉 お疲れ様でした！', width / 2, height / 2 - 30);

  noStroke();
  fill(220);
  textSize(15);
  text('5分間の集中が完了しました。\n一息ついて、また次のステップへ進みましょう。', width / 2, height / 2 + 20);
}

// --- 補助的な関数（コードをスッキリ整理：チャプター10） ---

function drawRainEffect() {
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    let rx = random(width);
    let ry = random(height);
    line(rx, ry, rx - 2, ry + 15);
  }
}

function updateOtherTasks() {
  for (let i = otherTasks.length - 1; i >= 0; i--) {
    otherTasks[i].update();
    otherTasks[i].display();
    if (otherTasks[i].isFinished()) {
      otherTasks.splice(i, 1);
    }
  }
  // 他者の自動参加（タイマーが動いていない時もコワーキングスペースは稼働）
  if (random(1) < 0.003 && otherTasks.length < 8) {
    let onlineTasks = ['論文を読む', 'タスク整理', '水飲む・集中', '日記を書く', 'コーディング'];
    otherTasks.push(new OtherUserTask(random(onlineTasks), false)); // 新規は下から出現
  }
}

function drawHeader() {
  fill(20, 25, 35, 200);
  noStroke();
  rect(0, 0, width, 40);
  fill(0, 255, 150);
  ellipse(25, 20, 10, 10);
  fill(230);
  textSize(14);
  textAlign(LEFT, CENTER);
  let totalOnline = otherTasks.length + (scene === 1 ? 1 : 0);
  text('コワーキングスペース（現在 ' + totalOnline + ' 人が作業中 / 環境音: 雨）', 45, 20);
}

// ボタンアクション：開始
function startMyTimer() {
  let inputVal = taskInput.value().trim();
  if (inputVal !== '') {
    myTaskText = inputVal;
    myTimer = totalDuration;
    taskInput.value('');
    userStartAudio();
    scene = 1; // ★タイマー画面に切り替え
  }
}

// ボタンアクション：タイトルに戻る
function backToTitle() {
  scene = 0; // ★タイトル画面に戻す
}
