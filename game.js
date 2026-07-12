const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const paddle = { x: ( canvas.width - 162 ) / 2, y: canvas.height - 30, width: 162, height: 14 };

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.min( Math.max( mouseX - paddle.width / 2, 0 ), canvas.width - paddle.width );
} );

const ball = { x: canvas.width / 2, y: paddle.y - 20, radius: 8, baseSpeed: 4, speed: 4, dx: 0, dy: 0 };
ball.dx = ball.speed * Math.cos( -Math.PI / 3 );
ball.dy = ball.speed * Math.sin( -Math.PI / 3 );

const BLOCK_COLORS = [ 'gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];
const BLOCK_COLS = 8;
const BLOCK_ROWS = 7;
const BLOCK_WIDTH = 90;
const BLOCK_HEIGHT = 30;
const BLOCK_PADDING = 6;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = ( canvas.width - ( BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_PADDING ) ) / 2;

const blocks = [];
for ( let row = 0; row < BLOCK_ROWS; row++ ) {
  for ( let col = 0; col < BLOCK_COLS; col++ ) {
    blocks.push( {
      x: BLOCK_OFFSET_LEFT + col * ( BLOCK_WIDTH + BLOCK_PADDING ),
      y: BLOCK_OFFSET_TOP + row * ( BLOCK_HEIGHT + BLOCK_PADDING ),
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: BLOCK_COLORS[ row ],
      destroyed: false,
      explodeStartTime: null,
    } );
  }
}

let score = 0;
let hitCount = 0;
const BLOCK_SCORE = 10;

function checkBlockCollisions() {
  for ( const block of blocks ) {
    if ( block.destroyed ) continue;

    const closestX = Math.min( Math.max( ball.x, block.x ), block.x + block.width );
    const closestY = Math.min( Math.max( ball.y, block.y ), block.y + block.height );
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    if ( dx * dx + dy * dy <= ball.radius * ball.radius ) {
      if ( Math.abs( dx ) > Math.abs( dy ) ) {
        ball.dx = -ball.dx;
      } else {
        ball.dy = -ball.dy;
      }

      block.destroyed = true;
      block.explodeStartTime = performance.now();
      score += BLOCK_SCORE;
      hitCount++;
      break;
    }
  }
}

function update() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.x - ball.radius < 0 ) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
  } else if ( ball.x + ball.radius > canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -ball.dx;
  }

  if ( ball.y - ball.radius < 0 ) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
  }

  if ( ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y + ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width ) {
    const relativeIntersectX = ( ball.x - ( paddle.x + paddle.width / 2 ) ) / ( paddle.width / 2 );
    const maxBounceAngle = 75 * Math.PI / 180;
    const bounceAngle = relativeIntersectX * maxBounceAngle;

    ball.dx = ball.speed * Math.sin( bounceAngle );
    ball.dy = -ball.speed * Math.cos( bounceAngle );
    ball.y = paddle.y - ball.radius;
  }

  checkBlockCollisions();
}

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  for ( const block of blocks ) {
    if ( !block.destroyed ) {
      drawSprite( ctx, 'block_' + block.color, block.x, block.y, block.width, block.height );
      continue;
    }

    const elapsed = performance.now() - block.explodeStartTime;
    if ( elapsed >= EXPLOSION_DURATION ) continue;

    const frameIndex = Math.min( Math.floor( elapsed / ( EXPLOSION_DURATION / 4 ) ), 3 );
    drawFrame( ctx, EXPLOSION_FRAMES[ block.color ][ frameIndex ], block.x, block.y, block.width, block.height );
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
