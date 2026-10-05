const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;


// Matter 엔진
let engine;


// 풍선 배열
let balloons = [];


// 현재 누르고 있는 풍선
let selectedBalloon = null;


// 마우스를 누른 위치
let firstX = 0;


// 이전 마우스 X 위치
let lastX = 0;


// 누른 시간
let pressTime = 0;


// 풍선을 누르고 있는지
let pressedBalloon = false;


// 길게 누르는 시간
let longPressTime = 250;


// 풍선 생성 시간
let lastSpawnTime = 0;


function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );


  // Matter 설정
  engine = Engine.create();


  // 위쪽으로 떠오르게
  engine.gravity.y = -1;


  // 중력의 강도
  engine.gravity.scale = 0.00015;
}


function draw() {

  // Matter update
  Engine.update(engine);


  // 배경
  background(245);


  // 풍선 생성
  spawnBalloon();


  // 길게 누르는 풍선
  growBalloon();


  // 드래그 바람
  windBalloon();


  // 풍선 표시
  for (let b of balloons) {

    b.display();
  }


  // 화면 밖 풍선 삭제
  removeOutsideBalloons();


// 설명
  fill(40);
  noStroke();
  textSize(12);
  textAlign(LEFT, BOTTOM);

  text(
    "1 클릭 — 바로 터진다\n" +
    "2 드래그 — 바람에 의해 움직인다\n" +
    "3 길게 누르기 — 커진 후 터진다",
    20,
    height - 20
  );


}


// 풍선 생성
function spawnBalloon() {

  if (millis() - lastSpawnTime > 350) {

    let x = random(
      40,
      width - 40
    );

    let y = height + 40;

    let r = random(
      35,
      55
    );

    balloons.push(
      new Balloon(
        x,
        y,
        r
      )
    );

    lastSpawnTime = millis();
  }
}


// 길게 누르면 풍선이 커짐
function growBalloon() {

  if (
    mouseIsPressed &&
    pressedBalloon &&
    selectedBalloon !== null
  ) {

    // 선택한 풍선을 멈춤
    Body.setVelocity(
      selectedBalloon.body,
      {
        x: 0,
        y: 0
      }
    );


    let heldTime =
      millis() - pressTime;


    if (heldTime > longPressTime) {

      selectedBalloon.grow();


      // 충분히 커지면 폭발
      if (
        selectedBalloon.r >= 100
      ) {

        selectedBalloon.remove();

        selectedBalloon = null;

        pressedBalloon = false;
      }
    }
  }
}


// 드래그하면서 바람 만들기
function windBalloon() {

  // 풍선을 누른 상태에서는 바람을 만들지 않음
  if (pressedBalloon) {
    return;
  }


  if (mouseIsPressed) {

    let dx =
      mouseX - lastX;


    // 좌우로 움직였을 때만 바람
    if (abs(dx) > 0) {

      dx = constrain(
        dx,
        -50,
        50
      );


      // 아주 약한 바람
      let forceX = dx * 0.00001;


      // 모든 풍선에 바람 적용
      for (let b of balloons) {

        let force = {

          x:
            forceX * b.body.mass,

          y: 0
        };


        Body.applyForce(
          b.body,
          b.body.position,
          force
        );
      }
    }
  }


  lastX = mouseX;
}


// 마우스를 누른 순간
function mousePressed() {

  firstX = mouseX;

  lastX = mouseX;

  pressTime = millis();

  pressedBalloon = false;

  selectedBalloon = null;


  // 클릭한 풍선 찾기
  for (
    let i = balloons.length - 1;
    i >= 0;
    i--
  ) {

    let b = balloons[i];

    let pos =
      b.body.position;


    let d = dist(
      mouseX,
      mouseY,
      pos.x,
      pos.y
    );


    if (d < b.r) {

      selectedBalloon = b;

      pressedBalloon = true;

      break;
    }
  }
}


// 마우스를 뗀 순간
function mouseReleased() {

  let heldTime =
    millis() - pressTime;


  // 풍선을 눌렀을 때
  if (pressedBalloon) {

    if (
      selectedBalloon !== null &&
      heldTime < longPressTime
    ) {

      // 짧게 클릭하면 바로 폭발
      selectedBalloon.remove();
    }


    // 길게 누른 뒤에는
    // 현재 크기를 유지하고 다시 움직임
    selectedBalloon = null;

    pressedBalloon = false;

    return;
  }


  lastX = mouseX;
}


// 화면 밖 풍선 삭제
function removeOutsideBalloons() {

  for (
    let i = balloons.length - 1;
    i >= 0;
    i--
  ) {

    let b = balloons[i];

    let pos =
      b.body.position;


    // 위로 완전히 나가면 삭제
    if (
      pos.y + b.r < 0
    ) {

      b.remove();

      balloons.splice(
        i,
        1
      );
    }


    // 폭발한 풍선
    else if (b.dead) {

      balloons.splice(
        i,
        1
      );
    }
  }
}


// 화면 크기 변경
function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}