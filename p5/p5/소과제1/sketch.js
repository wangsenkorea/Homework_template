function windowResized() {

  resizeCanvas(windowWidth,windowHeight);

}


const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;

let engine;

// 斜面
let leftSlope;
let rightSlope;
let bottomSlope;

// 球
let ball1;
let ball2;
let ball3;
let ball4;
let ball5;
let ball6;

// 方块
let square1;
let square2;

// 三角形
let triangle1;
let triangle2;

// 长方形
let rectangle1;

// 颜色
const bgColor = "#F4F1EA";

const slopeColor = "#343434";

const red = "#F05D5E";
const orange = "#E8A43A";
const yellow = "#E6C84A";

const blue = "#4D78E8";
const lightBlue = "#78A3F5";

const green = "#59A878";
const purple = "#9A70C7";

// 斜面
function createSlope(x1, y1, x2, y2, thickness) {

  let centerX = (x1 + x2) / 2;
  let centerY = (y1 + y2) / 2;

  let length = dist(
    x1,
    y1,
    x2,
    y2
  );

  let angle = atan2(
    y2 - y1,
    x2 - x1
  );

  return Bodies.rectangle(
    centerX,
    centerY,
    length,
    thickness,
    {
      isStatic: true,

      angle: angle,

      friction: 0.8,

      restitution: 0
    }
  );
}

// setup
function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  engine = Engine.create();

  // 중력
  engine.gravity.x = 0;
  engine.gravity.y = 1;

  engine.gravity.scale = 0.001;

  // 충돌
  engine.positionIterations = 12;
  engine.velocityIterations = 10;
  engine.constraintIterations = 4;

  // 左斜面
  leftSlope = createSlope(
    width * 0.08,
    height * 0.30,

    width * 0.39,
    height * 0.72,

    20
  );

  // 右斜面
  rightSlope = createSlope(
    width * 0.92,
    height * 0.32,

    width * 0.63,
    height * 0.76,

    20
  );

  // 下斜面
  bottomSlope = createSlope(
    width * 0.37,
    height * 0.72,

    width * 0.65,
    height * 0.80,

    20
  );

  // 大球
  ball1 = Bodies.circle(
    width * 0.17,
    height * 0.10,
    30,
    {
      restitution: 0.55,
      friction: 0.25,
      frictionAir: 0.008,
      density: 0.0015
    }
  );

  // 中球
  ball2 = Bodies.circle(
    width * 0.31,
    height * 0.13,
    19,
    {
      restitution: 0.62,
      friction: 0.25,
      frictionAir: 0.008,
      density: 0.001
    }
  );

  // 小球
  ball3 = Bodies.circle(
    width * 0.47,
    height * 0.09,
    11,
    {
      restitution: 0.7,
      friction: 0.2,
      frictionAir: 0.006,
      density: 0.0008
    }
  );

  // 大球
  ball4 = Bodies.circle(
    width * 0.70,
    height * 0.12,
    26,
    {
      restitution: 0.58,
      friction: 0.28,
      frictionAir: 0.008,
      density: 0.0014
    }
  );

  // 小球
  ball5 = Bodies.circle(
    width * 0.82,
    height * 0.20,
    13,
    {
      restitution: 0.72,
      friction: 0.18,
      frictionAir: 0.006,
      density: 0.0007
    }
  );

  // 小球
  ball6 = Bodies.circle(
    width * 0.56,
    height * 0.22,
    8,
    {
      restitution: 0.75,
      friction: 0.18,
      frictionAir: 0.005,
      density: 0.0006
    }
  );

  // 大方块
  square1 = Bodies.rectangle(
    width * 0.26,
    height * 0.15,
    70,
    70,
    {
      restitution: 0.12,
      friction: 0.8,
      frictionAir: 0.008,
      density: 0.0035
    }
  );

  // 小方块
  square2 = Bodies.rectangle(
    width * 0.63,
    height * 0.18,
    35,
    35,
    {
      restitution: 0.18,
      friction: 0.75,
      frictionAir: 0.008,
      density: 0.002
    }
  );

  // 大三角形
  triangle1 = Bodies.polygon(
    width * 0.42,
    height * 0.12,
    3,
    48,
    {
      restitution: 0.18,
      friction: 0.8,
      frictionAir: 0.008,
      density: 0.0025
    }
  );

  // 小三角形
  triangle2 = Bodies.polygon(
    width * 0.76,
    height * 0.16,
    3,
    27,
    {
      restitution: 0.2,
      friction: 0.78,
      frictionAir: 0.008,
      density: 0.0015
    }
  );

  // 长方形
  rectangle1 = Bodies.rectangle(
    width * 0.82,
    height * 0.34,
    125,
    28,
    {
      restitution: 0.1,
      friction: 0.85,
      frictionAir: 0.01,
      density: 0.004
    }
  );

  // 추가
  Composite.add(
    engine.world,
    [

      leftSlope,
      rightSlope,
      bottomSlope,

      ball1,
      ball2,
      ball3,
      ball4,
      ball5,
      ball6,

      square1,
      square2,

      triangle1,
      triangle2,

      rectangle1
    ]
  );
}

// draw
function draw() {

  background(bgColor);

  // 물리
  Engine.update(
    engine,
    1000 / 60
  );

  // 斜面
  drawBody(
    leftSlope,
    slopeColor
  );

  drawBody(
    rightSlope,
    slopeColor
  );

  drawBody(
    bottomSlope,
    slopeColor
  );

  // 球
  drawCircle(
    ball1,
    red
  );

  drawCircle(
    ball2,
    orange
  );

  drawCircle(
    ball3,
    yellow
  );

  drawCircle(
    ball4,
    blue
  );

  drawCircle(
    ball5,
    green
  );

  drawCircle(
    ball6,
    purple
  );

  // 方块
  drawBody(
    square1,
    blue
  );

  drawBody(
    square2,
    lightBlue
  );

  // 三角形
  drawBody(
    triangle1,
    green
  );

  drawBody(
    triangle2,
    yellow
  );

  // 长方形
  drawBody(
    rectangle1,
    purple
  );
}

// 球画出
function drawCircle(
  body,
  colorValue
) {

  push();

  fill(colorValue);

  noStroke();

  circle(
    body.position.x,
    body.position.y,
    body.circleRadius * 2
  );

  pop();
}

// 物体画出
function drawBody(
  body,
  colorValue
) {

  push();

  fill(colorValue);

  noStroke();

  beginShape();

  for (let v of body.vertices) {

    vertex(
      v.x,
      v.y
    );

  }

  endShape(CLOSE);

  pop();
}

