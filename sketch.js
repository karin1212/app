// === p5.js：5分間目標共有タイマー（自動カウントアップ継続モード版） ===

let taskInput;
let startButton;
let stopButton; // ★変更：作業を終了してタイトルに戻るボタン

// 画面の状態を管理する変数（0: タイトル, 1: タイマー・継続画面）
let scene = 0;

let myTimer = 0;
let myTaskText = '';
let totalDuration = 5 * 60 * 60; // 5分間（18000フレーム）
let isOvertime = false; // ★追加：5分を超えて継続しているかどうかのフラグ

let otherTasks = [];
let rainNoise;
let rainFilter;
let bgImage;

function preload() {
  bgImage = loadImage('fire.jpg');
}

// 他のユーザーのタスククラス
class OtherUserTask {
  constructor(text, isInitial = false) {
    this.text = text;
    this.timer = totalDuration;
    this.x = random(50, width - 150);

    if (isInitial) {
      this.timer = random(1000, totalDuration);
    }
  }

  update() {
    this.timer--;
  }

  display() {
    let progress = (totalDuration - this.timer) / totalDuration;
    let y = lerp(height + 20, 50, progress);

    let otherOffset = sin(frameCount * 0.01 + this.x) * 12;
    let finalX = this.x + otherOffset;

    stroke(0, 0, 0, 150);
    strokeWeight(3);
    fill(150, 200, 255, 180);
    textSize(14);
    text('👤 ' + this.text, finalX, y);

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

  let controlDiv = createDiv();
  controlDiv.position(10, height + 10);

  taskInput = createInput('');
  taskInput.parent(controlDiv);
  taskInput.attribute('placeholder', '今から5分間でやることを入力');
  taskInput.size(250);

  startButton = createButton('オンラインで開始宣言！');
  startButton.parent(controlDiv);
  startButton.mousePressed(startMyTimer);

  // ★変更：作業を終了するときのボタン（最初は隠しておく）
  stopButton = createButton('作業を終了する（タイトルへ）');
  stopButton.parent(controlDiv);
  stopButton.mousePressed(backToTitle);
  stopButton.hide();

  // 環境音のセットアップ
  rainNoise = new p5.Noise('pink');
  rainNoise.amp(0);
  rainFilter = new p5.LowPass();
  rainNoise.disconnect();
  rainNoise.connect(rainFilter);
  rainNoise.start();

  let sampleTasks = ['読書する', '英単語 暗記', '部屋の片付け'];
  for (let i = 0; i < 3; i++) {
    otherTasks.push(new OtherUserTask(random(sampleTasks), true));
  }
}

function draw() {
  background(bgImage);
  fill(0, 0, 0, 130);
  rect(0, 0, width, height);

  drawRainEffect();
  updateOtherTasks();

  if (scene === 0) {
    drawTitleScene();
  } else if (scene === 1) {
    drawTimerScene();
  }

  drawHeader();
}

// --- 各画面の描画関数 ---

// 0: タイトル画面
function drawTitleScene() {
  taskInput.show();
  startButton.show();
  stopButton.hide();

  fill(250);
  noStroke();
  textSize(22);
  textAlign(CENTER, CENTER);
  text('焚き火コワーキングタイマー', width / 2, height / 2 - 40);

  textSize(14);
  fill(180);
  text('5分間の集中目標を入力して\n「開始宣言」ボタンを押してください。', width / 2, height / 2 + 20);
}

// 1: タイマー・継続画面
function drawTimerScene() {
  taskInput.hide();
  startButton.hide();
  stopButton.show(); // 途中でやめたり、継続を終わらせるためのボタンを表示

  // ★タイマーの計算ロジック
  let myY;
  let timeString = '';

  if (!isOvertime) {
    // 【通常モード】5分間のカウントダウン
    myTimer--;

    let myProgress = (totalDuration - myTimer) / totalDuration;
    myY = lerp(height - 50, 50, myProgress); // 5分かけて上昇

    let remainingSeconds = Math.ceil(myTimer / 60);
    let displayMin = Math.floor(remainingSeconds / 60);
    let displaySec = remainingSeconds % 60;
    timeString = nf(displayMin, 2) + ':' + nf(displaySec, 2);

    // 5分経過したら継続モード（isOvertime = true）に切り替え
    if (myTimer <= 0) {
      isOvertime = true;
    }
  } else {
    // 【継続モード】自動でカウントアップに突入
    myTimer++; // 今度はフレーム数を足していく

    myY = 50; // 目標テキストは画面最上部（50の位置）でキープ

    let elapsedSeconds = Math.floor(myTimer / 60);
    let displayMin = Math.floor(elapsedSeconds / 60);
    let displaySec = elapsedSeconds % 60;
    timeString = '5分達成! + ' + nf(displayMin, 2) + ':' + nf(displaySec, 2);
  }

  // ゆっくりゆらゆらエフェクト（X座標）
  let offsetWithSin = sin(frameCount * 0.02) * 20;
  let myX = width / 2 + offsetWithSin;

  // 自分の目標テキストの描画
  stroke(0);
  strokeWeight(4);

  if (!isOvertime) {
    fill(255, 204, 0); // 通常時はゴールド
    textSize(22);
    text('🔥 ' + myTaskText, myX, myY);
  } else {
    fill(0, 255, 150); // 継続時は「ゾーン」を表すエメラルドグリーン
    textSize(22);
    text('🎉 ' + myTaskText + '（継続中）', myX, myY);
  }

  // 時間の表示
  noStroke();
  textSize(16);
  fill(255, 255, 255, 220);
  text(timeString, width / 2, myY + 30);

  // 雨音（環境音）は作業中ずっと流し続ける
  rainNoise.amp(0.15, 0.5);
  rainFilter.freq(800);
}

// --- 補助的な関数 ---

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
  if (random(1) < 0.003 && otherTasks.length < 8) {
    let onlineTasks = ['論文を読む', 'タスク整理', '水飲む・集中', '日記を書く', 'コーディング'];
    otherTasks.push(new OtherUserTask(random(onlineTasks), false));
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

  let headerText = 'コワーキングスペース（現在 ' + totalOnline + ' 人が作業中 / 環境音: 雨）';
  if (isOvertime && scene === 1) {
    headerText = '🔥 ボーナスタイム突入中！集中を維持しています。';
  }
  text(headerText, 45, 20);
}

// ボタンアクション：開始
function startMyTimer() {
  let inputVal = taskInput.value().trim();
  if (inputVal !== '') {
    myTaskText = inputVal;
    myTimer = totalDuration;
    isOvertime = false; // フラグをリセット
    taskInput.value('');
    userStartAudio();
    scene = 1;
  }
}

// ボタンアクション：作業終了してタイトルに戻る
function backToTitle() {
  rainNoise.amp(0, 0.5); // 雨音を止める
  scene = 0;
}
