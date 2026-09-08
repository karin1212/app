// === p5.js：焚き火を囲む・5分間マシュマロ焼きタイマー（焚き火SE版） ===

let taskInput;
let startButton;
let stopButton;
let controlDiv;

let scene = 0;
let myTimer = 0;
let myTaskText = '';
let totalDuration = 5 * 60 * 60; // 5分間
let isOvertime = false;

let otherTasks = [];
let bgImage;

// === 焚き火音（サウンド合成）用変数 ===
let fireRoarNoise; // 炎の「ゴー」という低音
let fireRoarFilter;
let crackleNoise; // パチパチ音用のノイズ
let crackleEnv; // パチパチ音のエンベロープ（一瞬だけ鳴らす仕組み）

// 焚き火の中心座標とマシュマロの距離
let fireX, fireY;
let fixedRadius = 80;

function preload() {
  bgImage = loadImage('fire.png');
}

// 他のユーザーのタスク（固定位置で焼いているマシュマロ）
class OtherUserTask {
  constructor(text, angle, isInitial = false) {
    this.text = text;
    this.timer = totalDuration;
    this.angle = angle;

    if (isInitial) {
      this.timer = random(1000, totalDuration);
    }
  }

  update() {
    this.timer--;
  }

  display() {
    let progress = (totalDuration - this.timer) / totalDuration;

    let x = fireX + cos(this.angle) * fixedRadius;
    let y = fireY + sin(this.angle) * fixedRadius;

    let swing = sin(frameCount * 0.015 + this.angle) * 5;
    let finalX = x + cos(this.angle + HALF_PI) * swing;
    let finalY = y + sin(this.angle + HALF_PI) * swing;

    // 串（外側から焚き火の中心へ）
    stroke(115, 74, 18);
    strokeWeight(2);
    let handX = fireX + cos(this.angle) * (min(width, height) * 0.4);
    let handY = fireY + sin(this.angle) * (min(width, height) * 0.4);
    line(handX, handY, finalX, finalY);

    // 焼き色
    let r = lerp(255, 139, progress);
    let g = lerp(255, 90, progress);
    let b = lerp(255, 43, progress);

    push();
    translate(finalX, finalY);
    rotate(this.angle);
    noStroke();
    fill(r, g, b);
    rectMode(CENTER);
    rect(0, 0, 22, 16, 4);
    pop();

    // タスク表示
    stroke(0, 0, 0, 150);
    strokeWeight(3);
    fill(255, 255, 255, 180);
    textSize(11);
    textAlign(CENTER, CENTER);
    text('👤 ' + this.text, finalX, finalY - 22);
  }

  isFinished() {
    return this.timer <= 0;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  updatePositions();

  controlDiv = createDiv();
  updateUIPosition();

  taskInput = createInput('');
  taskInput.parent(controlDiv);
  taskInput.attribute('placeholder', '今から5分間でやることを入力');
  taskInput.size(220);

  startButton = createButton('オンラインで開始宣言！');
  startButton.parent(controlDiv);
  startButton.mousePressed(startMyTimer);

  stopButton = createButton('作業を終了する（タイトルへ）');
  stopButton.parent(controlDiv);
  stopButton.mousePressed(backToTitle);
  stopButton.hide();

  // ★ 焚き火の音（ASMR合成）の初期化 ★
  // 1. 炎の低音（ゴーという音）
  fireRoarNoise = new p5.Noise('brown');
  fireRoarNoise.amp(0);
  fireRoarFilter = new p5.LowPass();
  fireRoarFilter.freq(250); // 低音域に絞る
  fireRoarNoise.disconnect();
  fireRoarNoise.connect(fireRoarFilter);
  fireRoarNoise.start();

  // 2. パチパチとはぜる音（クラックル音）
  crackleNoise = new p5.Noise('white');
  crackleNoise.amp(0);
  crackleEnv = new p5.Envelope();
  crackleEnv.setADSR(0.001, 0.03, 0, 0.01); // 一瞬で立ち上がり一瞬で消える設定
  crackleEnv.setRange(0.2, 0);
  crackleNoise.start();

  // 初期メンバー配置
  let sampleTasks = ['読書する', '英単語 暗記', '部屋の片付け'];
  let angles = [PI * 0.25, PI * 0.75, PI * 1.6];
  for (let i = 0; i < 3; i++) {
    otherTasks.push(new OtherUserTask(random(sampleTasks), angles[i], true));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updatePositions();
  updateUIPosition();
}

function updatePositions() {
  fireX = width / 2;
  fireY = height / 2 + 20;
}

function updateUIPosition() {
  if (controlDiv) {
    controlDiv.position(width / 2 - 170, height - 60);
  }
}

function keyPressed() {
  if (keyCode === ENTER && scene === 0) {
    startMyTimer();
  }
}

function draw() {
  background(bgImage);
  fill(0, 0, 0, 110);
  rectMode(CORNER);
  rect(0, 0, width, height);

  updateOtherTasks();

  if (scene === 0) {
    drawTitleScene();
  } else if (scene === 1) {
    drawTimerScene();
    playCampfireAudio(); // ★ 焚き火の音を再生・コントロール
  }

  drawHeader();
}

// ★ 不定期にパチパチ音を再生するロジック ★
function playCampfireAudio() {
  // 炎のベース音の音量
  fireRoarNoise.amp(0.12, 0.2);

  // ランダムなタイミング（毎フレーム約5%の確率）でパチッと弾けさせる
  if (random(1) < 0.06) {
    crackleEnv.play(crackleNoise);
  }
}

function drawTitleScene() {
  taskInput.show();
  startButton.show();
  stopButton.hide();

  fill(250);
  noStroke();
  textSize(22);
  textAlign(CENTER, CENTER);
  text('焚き火マシュマロ・コワーキング', width / 2, height / 2 - 50);

  textSize(14);
  fill(180);
  text(
    '5分間の集中目標を入力して「開始宣言（またはEnter）」を押すと\n焚き火のそばでじっくりマシュマロを焼き始めます。',
    width / 2,
    height / 2 + 10
  );
}

function drawTimerScene() {
  taskInput.hide();
  startButton.hide();
  stopButton.show();

  let progress = 0;
  let timeString = '';

  if (!isOvertime) {
    myTimer--;
    progress = (totalDuration - myTimer) / totalDuration;

    let remainingSeconds = Math.ceil(myTimer / 60);
    let displayMin = Math.floor(remainingSeconds / 60);
    let displaySec = remainingSeconds % 60;
    timeString = nf(displayMin, 2) + ':' + nf(displaySec, 2);

    if (myTimer <= 0) {
      isOvertime = true;
    }
  } else {
    myTimer++;
    progress = 1.0;

    let elapsedSeconds = Math.floor(myTimer / 60);
    let displayMin = Math.floor(elapsedSeconds / 60);
    let displaySec = elapsedSeconds % 60;
    timeString = '5分達成! + ' + nf(displayMin, 2) + ':' + nf(displaySec, 2);
  }

  let myAngle = HALF_PI;

  let offsetWithSin = sin(frameCount * 0.02) * 15;
  let finalX = fireX + cos(myAngle) * fixedRadius + offsetWithSin;
  let finalY = fireY + sin(myAngle) * fixedRadius;

  // 自分の串
  stroke(139, 90, 43);
  strokeWeight(5);
  line(
    fireX + cos(myAngle) * (min(width, height) * 0.45),
    fireY + sin(myAngle) * (min(width, height) * 0.45),
    finalX,
    finalY
  );

  // 焼き色
  let r = lerp(255, 139, progress);
  let g = lerp(255, 90, progress);
  let b = lerp(255, 43, progress);

  // マシュマロ本体
  noStroke();
  fill(r, g, b);
  rectMode(CENTER);
  rect(finalX, finalY, 65, 50, 12);

  // 顔の描画
  push();
  translate(finalX, finalY);
  if (!isOvertime) {
    fill(40);
    ellipse(-14, -3, 5, 7);
    ellipse(14, -3, 5, 7);
    stroke(40);
    strokeWeight(2);
    noFill();
    arc(0, 5, 6, 6, 0, PI);
  } else {
    stroke(60, 30, 0);
    strokeWeight(3);
    noFill();
    arc(-14, -5, 8, 8, PI, 0);
    arc(14, -5, 8, 8, PI, 0);
    fill(150, 40, 20);
    strokeWeight(2);
    arc(0, 3, 12, 10, 0, PI, CHORD);
    noStroke();
    fill(255, 150, 150, 200);
    ellipse(-22, 5, 8, 5);
    ellipse(22, 5, 8, 5);
  }
  pop();

  // ほかほか湯気エフェクト
  if (isOvertime) {
    noStroke();
    fill(255, 255, 255, 80);
    for (let i = 0; i < 3; i++) {
      let steamY = finalY - 35 - ((frameCount + i * 40) % 60);
      let steamX = finalX + sin(frameCount * 0.05 + i) * 6;
      let steamSize = map((frameCount + i * 40) % 60, 0, 60, 10, 2);
      ellipse(steamX, steamY, steamSize, steamSize);
    }
  }

  // 目標ボードとタイマー
  stroke(0);
  strokeWeight(4);
  if (!isOvertime) {
    fill(255, 230, 150);
    rect(finalX, finalY + 52, textWidth(myTaskText) + 30, 30, 8);
    noStroke();
    fill(50, 30, 0);
    textSize(14);
    text('🔥 ' + myTaskText, finalX, finalY + 52);
  } else {
    fill(130, 255, 180);
    rect(finalX, finalY + 52, textWidth(myTaskText) + 110, 30, 8);
    noStroke();
    fill(20, 50, 30);
    textSize(14);
    text('🎉 ' + myTaskText + '（こんがり！）', finalX, finalY + 52);
  }

  // タイマー表示
  stroke(0);
  strokeWeight(3);
  textSize(15);
  fill(255, 255, 255, 220);
  text(timeString, finalX, finalY + 80);
}

function updateOtherTasks() {
  for (let i = otherTasks.length - 1; i >= 0; i--) {
    otherTasks[i].update();
    otherTasks[i].display();
    if (otherTasks[i].isFinished()) {
      otherTasks.splice(i, 1);
    }
  }

  if (random(1) < 0.003 && otherTasks.length < 6) {
    let onlineTasks = ['読書中...', '資料作成', '英単語!', '片付け', 'コード書く', '企画出し'];
    let randomAngle = random(PI * 1.1, PI * 1.9);
    otherTasks.push(new OtherUserTask(random(onlineTasks), randomAngle, false));
  }
}

function drawHeader() {
  fill(20, 25, 35, 220);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, 40);

  fill(0, 255, 150);
  ellipse(25, 20, 10, 10);

  fill(230);
  textSize(14);
  textAlign(LEFT, CENTER);
  let totalOnline = otherTasks.length + (scene === 1 ? 1 : 0);

  let headerText = 'コワーキングキャンプ（現在 ' + totalOnline + ' 人で焚き火を囲み中 / 環境音: 焚き火）';
  if (isOvertime && scene === 1) {
    headerText = '✨ こんがりボーナスタイム！さらに集中を深めています。';
  }
  text(headerText, 45, 20);
}

function startMyTimer() {
  let inputVal = taskInput.value().trim();
  if (inputVal !== '') {
    myTaskText = inputVal;
    myTimer = totalDuration;
    isOvertime = false;
    taskInput.value('');
    userStartAudio();
    scene = 1;
  }
}

function backToTitle() {
  if (fireRoarNoise) fireRoarNoise.amp(0, 0.5);
  scene = 0;
}
