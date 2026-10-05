// 풍선 클래스

class Balloon {

  constructor(x, y, r) {

    this.x = x;
    this.y = y;
    this.r = r;

    // 풍선 컬러
    this.c = color(
      random(80, 255),
      random(80, 255),
      random(80, 255)
    );

    // Matter Body
    this.body = Bodies.circle(
      this.x,
      this.y,
      this.r,
      {
        restitution: 0.2,
        frictionAir: 0.01
      }
    );

    Composite.add(
      engine.world,
      this.body
    );

    this.dead = false;
  }


  // 풍선 표시
  display() {

    let pos = this.body.position;

    push();

    noStroke();

    fill(this.c);

    ellipse(
      pos.x,
      pos.y,
      this.r * 2,
      this.r * 2.2
    );

    // 풍선 끈
    stroke(this.c);
    strokeWeight(1);

    line(
      pos.x,
      pos.y + this.r,
      pos.x,
      pos.y + this.r + 25
    );

    pop();
  }


  // 풍선 크기 키우기
  grow() {

    if (this.r < 100) {

      this.r += 0.5;
    }
  }


  // 풍선 삭제
  remove() {

    Composite.remove(
      engine.world,
      this.body
    );

    this.dead = true;
  }
}