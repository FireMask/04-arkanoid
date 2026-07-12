const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const overlay = document.getElementById( 'overlay' );
const overlayTitle = document.getElementById( 'overlay-title' );
const restartBtn = document.getElementById( 'restart-btn' );

const PADDLE_START_X = ( canvas.width - 162 ) / 2;
const paddle = { x: PADDLE_START_X, y: canvas.height - 30, width: 162, height: 14 };

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.min( Math.max( mouseX - paddle.width / 2, 0 ), canvas.width - paddle.width );
} );

const ball = { x: 0, y: 0, radius: 8, baseSpeed: 4, speed: 4, dx: 0, dy: 0 };

const bounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );
let audioUnlocked = false;

canvas.addEventListener( 'mousemove', () => { audioUnlocked = true; }, { once: true } );

function playSound( audio ) {
  if ( !audioUnlocked ) return;
  audio.currentTime = 0;
  audio.play().catch( () => {} );
}

const BLOCK_COLS = 8;
const BLOCK_ROWS = 7;
const BLOCK_WIDTH = 90;
const BLOCK_HEIGHT = 30;
const BLOCK_PADDING = 6;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = ( canvas.width - ( BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_PADDING ) ) / 2;

let currentLevelIndex = 0;

function createBlocks() {
  const created = [];
  const rows = LEVELS.levels[ currentLevelIndex ].rows;
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      const color = rows[ row ][ col ];
      if ( color === null ) continue;

      created.push( {
        x: BLOCK_OFFSET_LEFT + col * ( BLOCK_WIDTH + BLOCK_PADDING ),
        y: BLOCK_OFFSET_TOP + row * ( BLOCK_HEIGHT + BLOCK_PADDING ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: color,
        destroyed: false,
        explodeStartTime: null,
      } );
    }
  }
  return created;
}

let blocks = createBlocks();

let score = 0;
let hitCount = 0;
let gameState = 'playing';
const BLOCK_SCORE = 10;

const LEVEL_TRANSITION_DURATION = 750;
let levelTransitionStartTime = null;

const HIGH_SCORE_KEY = 'arkanoid-high-score';
let highScore = parseInt( localStorage.getItem( HIGH_SCORE_KEY ), 10 ) || 0;

function resetGame() {
  currentLevelIndex = 0;

  paddle.x = PADDLE_START_X;

  ball.x = canvas.width / 2;
  ball.y = paddle.y - 20;
  ball.speed = ball.baseSpeed;
  ball.dx = ball.speed * Math.cos( -Math.PI / 3 );
  ball.dy = ball.speed * Math.sin( -Math.PI / 3 );

  blocks = createBlocks();
  score = 0;
  hitCount = 0;
  gameState = 'playing';
  overlay.classList.add( 'hidden' );
}

restartBtn.addEventListener( 'click', resetGame );

resetGame();

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
      playSound( breakSound );

      if ( hitCount % 5 === 0 ) {
        const newSpeed = Math.min( ball.speed * 1.1, ball.baseSpeed * 1.5 );
        const ratio = newSpeed / ball.speed;
        ball.dx *= ratio;
        ball.dy *= ratio;
        ball.speed = newSpeed;
      }

      break;
    }
  }
}

function endGame( state ) {
  gameState = state;
  overlayTitle.textContent = state === 'win' ? 'You Win' : 'Game Over';
  overlay.classList.remove( 'hidden' );

  if ( score > highScore ) {
    highScore = score;
    localStorage.setItem( HIGH_SCORE_KEY, String( highScore ) );
  }
}

function advanceLevel() {
  currentLevelIndex++;
  blocks = createBlocks();

  paddle.x = PADDLE_START_X;

  ball.x = canvas.width / 2;
  ball.y = paddle.y - 20;
  ball.speed = ball.baseSpeed;
  ball.dx = ball.speed * Math.cos( -Math.PI / 3 );
  ball.dy = ball.speed * Math.sin( -Math.PI / 3 );

  gameState = 'playing';
}

function update() {
  if ( gameState === 'levelTransition' ) {
    if ( performance.now() - levelTransitionStartTime >= LEVEL_TRANSITION_DURATION ) {
      advanceLevel();
    }
    return;
  }

  if ( gameState !== 'playing' ) return;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.x - ball.radius < 0 ) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
    playSound( bounceSound );
  } else if ( ball.x + ball.radius > canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -ball.dx;
    playSound( bounceSound );
  }

  if ( ball.y - ball.radius < 0 ) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
    playSound( bounceSound );
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
    playSound( bounceSound );
  }

  checkBlockCollisions();

  if ( ball.y - ball.radius > canvas.height ) {
    endGame( 'gameover' );
    return;
  }

  const allCleared = blocks.every( ( block ) =>
    block.destroyed && performance.now() - block.explodeStartTime >= EXPLOSION_DURATION );
  if ( allCleared ) {
    if ( currentLevelIndex < 4 ) {
      gameState = 'levelTransition';
      levelTransitionStartTime = performance.now();
    } else {
      endGame( 'win' );
    }
  }
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

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText( 'Score: ' + score, 10, 10 );
  ctx.textAlign = 'center';
  ctx.fillText( 'Level ' + ( currentLevelIndex + 1 ), canvas.width / 2, 10 );
  ctx.textAlign = 'right';
  ctx.fillText( 'High Score: ' + highScore, canvas.width - 10, 10 );

  if ( gameState === 'levelTransition' ) {
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText( 'Level ' + ( currentLevelIndex + 2 ), canvas.width / 2, canvas.height / 2 );
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
