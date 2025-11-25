let spriteSheet;
let walkSheet;
let jumpSheet;
let pushSheet;
let toolSheet;

let animation = [];
let walkAnimation = [];
let jumpAnimation = [];
let pushAnimation = [];
let toolAnimation = [];

let spriteWidth = 1955;
let spriteHeight = 212;
let numFrames = 14;
let frameWidth;

let walkSpriteWidth = 1246;
let walkSpriteHeight = 198;
let walkNumFrames = 9;
let walkFrameWidth;

let jumpSpriteWidth = 1913;
let jumpSpriteHeight = 188;
let jumpNumFrames = 14;
let jumpFrameWidth;

let pushSpriteWidth = 1039;
let pushSpriteHeight = 146;
let pushNumFrames = 4;
let pushFrameWidth;

let toolSpriteWidth = 740;
let toolSpriteHeight = 19;
let toolNumFrames = 5;
let toolFrameWidth;

let currentFrame = 0;
let walkCurrentFrame = 0;
let jumpCurrentFrame = 0;
let pushCurrentFrame = 0;
let animationSpeed = 0.1; // 調整這個值可以改變動畫速度，數字越小越慢
let walkAnimationSpeed = 0.2;
let jumpAnimationSpeed = 0.3;
let pushAnimationSpeed = 0.15;
let toolAnimationSpeed = 0.3;

// 角色位置與移動速度
let characterX;
let characterY;
let moveSpeed = 5;

// 角色狀態
let isJumping = false;
let jumpHeight = 150; // 角色跳躍的高度
let facingDirection = 1; // 角色面向的方向: 1=右, -1=左
let isPushing = false;
let hasFired = false; // 確保每次攻擊只發射一次

// 飛行道具陣列，可以管理多個道具
let projectiles = [];

function preload() {
  // 在 preload 函式中載入圖片，確保在 setup() 開始前圖片已完全載入
  // p5.js 會從 index.html 檔案的位置去尋找相對路徑
  spriteSheet = loadImage('1/stop/stop.png');
  walkSheet = loadImage('1/walk/walk.png');
  jumpSheet = loadImage('1/jump/jump.png');
  pushSheet = loadImage('1/push/push.png');
  toolSheet = loadImage('1/tool/tool.png');
}

function setup() {
  // 建立一個佔滿整個瀏覽器視窗的畫布
  createCanvas(windowWidth, windowHeight);

  // 計算單一畫格的寬度
  frameWidth = spriteWidth / numFrames;

  // 從圖片精靈中切割出每一幀並存入 animation 陣列
  for (let i = 0; i < numFrames; i++) {
    let frame = spriteSheet.get(i * frameWidth, 0, frameWidth, spriteHeight);
    animation.push(frame);
  }
  
  // 計算走路動畫單一畫格的寬度並存入陣列
  walkFrameWidth = walkSpriteWidth / walkNumFrames;
  for (let i = 0; i < walkNumFrames; i++) {
    let frame = walkSheet.get(i * walkFrameWidth, 0, walkFrameWidth, walkSpriteHeight);
    walkAnimation.push(frame);
  }

  // 計算跳躍動畫單一畫格的寬度並存入陣列
  jumpFrameWidth = jumpSpriteWidth / jumpNumFrames;
  for (let i = 0; i < jumpNumFrames; i++) {
    let frame = jumpSheet.get(i * jumpFrameWidth, 0, jumpFrameWidth, jumpSpriteHeight);
    jumpAnimation.push(frame);
  }

  // 計算攻擊動畫單一畫格的寬度並存入陣列
  pushFrameWidth = pushSpriteWidth / pushNumFrames;
  for (let i = 0; i < pushNumFrames; i++) {
    let frame = pushSheet.get(i * pushFrameWidth, 0, pushFrameWidth, pushSpriteHeight);
    pushAnimation.push(frame);
  }

  // 計算飛行道具動畫單一畫格的寬度並存入陣列
  toolFrameWidth = toolSpriteWidth / toolNumFrames;
  for (let i = 0; i < toolNumFrames; i++) {
    let frame = toolSheet.get(i * toolFrameWidth, 0, toolFrameWidth, toolSpriteHeight);
    toolAnimation.push(frame);
  }

  // 設定圖片繪製模式為中心點對齊，方便將圖片置中
  imageMode(CENTER);

  // 初始化角色位置在畫布中央
  characterX = width / 2;
  characterY = height / 2;
}

function draw() {
  // 設定畫布背景顏色
  background('#e6ccb2');

  // 處理並繪製所有飛行道具
  // 從後往前遍歷，方便安全地從陣列中移除元素
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.speed * p.direction;
    
    if (p.direction === 1) {
      image(toolAnimation[floor(p.currentFrame)], p.x, p.y);
    } else {
      push();
      translate(p.x, p.y);
      scale(-1, 1);
      image(toolAnimation[floor(p.currentFrame)], 0, 0);
      pop();
    }
    
    p.currentFrame = (p.currentFrame + toolAnimationSpeed) % toolNumFrames;

    // 如果飛行道具完全離開畫布的可視範圍，就將其從陣列中移除
    // 判斷條件為：物件中心點 超出 畫布邊界 + 物件寬度的一半
    if (p.x > width + (toolFrameWidth / 2) || p.x < -(toolFrameWidth / 2)) {
      projectiles.splice(i, 1);
    }
  }

  // 優先處理跳躍狀態
  if (isPushing) {
    // 播放攻擊動畫
    if (facingDirection === 1) {
      image(pushAnimation[floor(pushCurrentFrame)], characterX, characterY);
    } else {
      push();
      translate(characterX, characterY);
      scale(-1, 1);
      image(pushAnimation[floor(pushCurrentFrame)], 0, 0);
      pop();
    }

    pushCurrentFrame += pushAnimationSpeed;

    // 在動畫的特定幀產生飛行道具
    if (floor(pushCurrentFrame) === 3 && !hasFired) {
      let newProjectile = {
        x: characterX + (50 * facingDirection), // 在角色前方產生
        y: characterY - 20, // 調整Y軸位置
        direction: facingDirection,
        speed: 12,
        currentFrame: 0
      };
      projectiles.push(newProjectile); // 將新道具加入陣列
      hasFired = true; // 標記本次攻擊已發射
    }

    // 動畫結束後，返回待機
    if (pushCurrentFrame >= pushNumFrames) {
      isPushing = false;
      pushCurrentFrame = 0;
    }
  } else if (isJumping) {
    // 根據目前播放的畫格計算 Y 軸位移，形成拋物線
    let jumpProgress = jumpCurrentFrame / (jumpNumFrames -1); // 0 到 1 的進度
    let currentJumpHeight = sin(jumpProgress * PI) * jumpHeight;
    let yPos = characterY - currentJumpHeight;

    // 根據角色方向繪製跳躍動畫
    if (facingDirection === 1) {
      // 面向右
      image(jumpAnimation[floor(jumpCurrentFrame)], characterX, yPos);
    } else {
      // 面向左，翻轉圖片
      push();
      translate(characterX, yPos);
      scale(-1, 1);
      image(jumpAnimation[floor(jumpCurrentFrame)], 0, 0);
      pop();
    }

    // 更新跳躍動畫畫格
    jumpCurrentFrame += jumpAnimationSpeed;

    // 如果動畫播放完畢
    if (jumpCurrentFrame >= jumpNumFrames) {
      isJumping = false; // 結束跳躍狀態
      jumpCurrentFrame = 0; // 重置畫格計數器
    }
  } else {
    // 非跳躍狀態下，檢查左右移動
    if (keyIsDown(RIGHT_ARROW)) {
      facingDirection = 1; // 更新方向為右
      // 更新角色位置
      characterX += moveSpeed;
      // 顯示走路動畫
      image(walkAnimation[floor(walkCurrentFrame)], characterX, characterY);
      // 更新走路動畫的畫格
      walkCurrentFrame = (walkCurrentFrame + walkAnimationSpeed) % walkNumFrames;
    } else if (keyIsDown(LEFT_ARROW)) {
      facingDirection = -1; // 更新方向為左
      // 更新角色位置
      characterX -= moveSpeed;
      
      // 透過 translate 和 scale(-1, 1) 來水平翻轉圖片
      push(); // 儲存目前的繪圖設定
      translate(characterX, characterY); // 將原點移動到角色位置
      scale(-1, 1); // 水平翻轉座標系
      image(walkAnimation[floor(walkCurrentFrame)], 0, 0); // 在新的原點繪製圖片
      pop(); // 恢復原本的繪圖設定

      // 更新走路動畫的畫格
      walkCurrentFrame = (walkCurrentFrame + walkAnimationSpeed) % walkNumFrames;
    } else {
      // 顯示待機動畫
      image(animation[floor(currentFrame)], characterX, characterY);
      // 更新待機動畫的畫格
      currentFrame = (currentFrame + animationSpeed) % numFrames;
    }
  }
}

// 當瀏覽器視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 偵測單次按鍵事件來觸發跳躍
function keyPressed() {
  if (keyCode === UP_ARROW && !isJumping) {
    isJumping = true;
  } else if (keyCode === 32 && !isJumping && !isPushing) { // 32是空白鍵
    isPushing = true;
    hasFired = false; // 重置發射旗標
  }
}
