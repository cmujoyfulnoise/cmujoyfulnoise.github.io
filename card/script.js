const num = 3;
let step = 2;
let reverse = false;
let instr = 1;
let zoom = 1;

const incr = () => {
  step = (step + 1) % num;
}

const decr = () => {
  step = (step + (num - 1)) % num;
}

const replace = () => {
  ['top', 'bottom'].forEach((side) => {
    const elem = document.getElementById(side);
    const copy = elem.cloneNode(true);
    elem.parentNode.replaceChild(copy, elem);
  });
  addZoomListeners();
};

const showNextInstr = () => {
  switch(instr) {
    case 1:
      document.getElementById('instr-1').style.opacity = 0;
      document.getElementById('instr-2').style.opacity = 1;
      break;
    case 2:
      document.getElementById('instr-2').style.opacity = 0;
      document.getElementById('instr-3').style.opacity = 1;
      break;
    case 3:
      document.getElementById('instr-3').style.opacity = 0;
      break;
    default:
      return;
  }
  instr++;
}

const nextPage = () => {
  showNextInstr();

  if (!reverse) {
    incr();
    animate();
  } else {
    reverse = false;
    animate();
    replace();
  }
};

const prevPage = () => {
  showNextInstr();

  if (reverse) {
    decr();
    animate();
  } else {
    reverse = true;
    animate();
    replace();
  }
};

document.getElementById('right-half').addEventListener('click', (e) => {
  nextPage();
});

document.getElementById('left-half').addEventListener('click', (e) => {
  prevPage();
});

document.addEventListener('keydown', (e) => {
  const forwardCodes = [39, 40, 34, 32]; // right, down, page down, space
  const backwardsCodes = [37, 38, 33, 8]; // left, up, page up, backspace
  if (forwardCodes.indexOf(e.keyCode) !== -1) {
    nextPage();
  } else if (backwardsCodes.indexOf(e.keyCode) !== -1) {
    prevPage();
  }
});

const animate = () => {
  document.getElementById('top').style.animationName = `flip-top-${step}`;
  document.getElementById('bottom').style.animationName = `flip-bottom-${step}`;

  const dir = reverse ? 'reverse' : 'normal';

  document.getElementById('top').style.animationDirection = dir;
  document.getElementById('bottom').style.animationDirection = dir;
};

const addZoomListeners = () => {
  for (const el of document.getElementsByClassName('card-page')) {
    el.addEventListener('click', (e) => {
      switch(zoom) {
        case 1:
          zoom = 'auto';
          break;
        case 'auto':
          zoom = 2;
          break;
        case 2:
          zoom = 1;
          break;
      }
      window.scroll(0, 0);
      resize();
    });
  }
};
addZoomListeners();

const resize = () => {
  let { innerWidth: w, innerHeight: h } = window;
  const margin = 0.05 * Math.min(w, h);
  w -= margin;
  h -= margin;

  const ratio = 11/8.5;
  let cardWidth;
  if (w * ratio <= h) {
    // works based on width
    cardWidth = w;
  } else {
    // based on height
    cardWidth = h/ratio;
  }

  if (zoom === 'auto') {
    if (w * ratio <= h) {
      // works based on width
      cardWidth = h/ratio;
    } else {
      // based on height
      cardWidth = w;
    }
  } else {
    cardWidth *= zoom;
  }

  let cardHeight = cardWidth * ratio;

  const cardWrapper = document.getElementById('card-wrapper');
  cardWrapper.style.width = `${cardWidth}px`;
  cardWrapper.style.height = `${cardHeight}px`;

  document.getElementById('top').style.marginTop = `${cardHeight/2}px`;
  document.getElementById('bottom').style.marginTop = `-${cardHeight}px`;

  let width = null;
  let height  = null;
  let overflowY = 'hidden';
  let overflowX = 'hidden';
  switch (zoom) {
    case 2:
      if (cardWidth > window.innerWidth) {
        overflowX = 'auto';
      }
    case 'auto':
      if (cardHeight > window.innerHeight) {
        overflowY = 'auto';
      }
      break;
  }

  document.body.style.width = width;
  document.body.style.height = height;
  document.body.style.overflowY = overflowY;
  document.body.style.overflowX = overflowX;
}

window.addEventListener('resize', (e) => {
  resize();
});

resize();

let imagesToLoad = 3;
let numDots = 0;
const loadingInterval = setInterval(() => {
  let text = 'Loading.';
  for (let i = 0; i < 2; i++) {
    if (i < numDots) {
      text += '.';
    } else {
      text += '<span class="hidedot">.</span>';
    }
  }
  document.getElementById('loadertext').innerHTML = text;
  numDots = (numDots + 1) % 3;
}, 750);
for (const name of ['front', 'inside', 'back']) {
  const img = new Image();
  img.onload = () => {
    if (--imagesToLoad === 0) {
      document.getElementById('loader').style.opacity = 0;
      setTimeout(() => {
        clearInterval(loadingInterval);
        document.getElementById('loader').remove();
      }, 1000);
    }
  }
  img.src = `./card/${name}.png`;
  if (img.complete) img.onload();
}
