function copy(x) {
    return JSON.parse(JSON.stringify(x));
}

const {Application, Graphics, Text, TextStyle, Texture, Sprite, Assets, Container, ParticleContainer, AnimatedSprite, TilingSprite, BlurFilter} = PIXI;

const screenWidth = $(document).width() - 10;
const screenHeight = $(document).height() - 10;

const app = new Application({
    width: screenWidth,
    height: screenHeight,
    transparent: false,
    antialias: true,
});

app.renderer.view.style.position = 'absolute';
document.body.appendChild(app.view);

const assets = {
    background: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/stars.jpg?v=1707800986965',
    blackhole: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/blackhole.png?v=1707888961956',
    none_px: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/none.png?v=1708394959363',
    asteroid_px: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/asteroid.png?v=1708307201900',
    asteroid1: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/asteroid1.png?v=1708308266458',
    asteroid2: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/asteroid2.png?v=1708387041175',
    asteroid3: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/asteroid3.png?v=1708387115624',
    planet_px: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/planet.png?v=1708389400442',
    planet1: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/planet1.png?v=1708388424901',
    planet2: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/planet2.png?v=1708388442626',
    planet3: 'https://cdn.glitch.global/8ac2ee8f-1282-4c40-ad0b-00199fa20102/planet3.png?v=1708388454637',
}

const textures = {}
Object.keys(assets).forEach(id => {
    textures[id] = Texture.from(assets[id]);
})

let count = 0;

function increment(delta) {
    count += delta;
}
app.ticker.add(increment)

const backgroundSprite = new TilingSprite(
    textures.background,
    screenWidth * 2,
    screenHeight * 2
)
backgroundSprite.name = 'background';
backgroundSprite.zIndex = -100;
backgroundSprite.tileScale.set(0.5);
backgroundSprite.anchor.set(0.5);
backgroundSprite.position.set(
    screenWidth / 2,
    screenHeight / 2
);

function rotateBackground(delta) {
    backgroundSprite.rotation += delta * 0.00025;
}
app.ticker.add(rotateBackground);
app.stage.addChild(backgroundSprite);

const blackholeSprite = new Sprite(
    textures.blackhole,
    200,
    200
);
blackholeSprite.name = 'blackhole';
blackholeSprite.anchor.set(0.5);
const blackholePos = [screenWidth / 2, screenHeight / 2];
blackholeSprite.position.set(
    blackholePos[0],
    blackholePos[1],
);

function rotateBlackhole(delta) {
    blackholeSprite.rotation += delta * 0.01;
    blackholeSprite.scale.set(1 + 0.1 * Math.sin(count / 100))
}
app.ticker.add(rotateBlackhole);
app.stage.addChild(blackholeSprite);

let selectedObject = 'none';

const objectList = {
    none: {
        name: 'none',
        images: [],
        height: 0,
        width: 0,
        orbit: 0,
        pull: 0,
    },
    asteroid: {
        name: 'asteroid',
        images: [textures.asteroid1, textures.asteroid2, textures.asteroid3],
        height: 128,
        width: 128,
        orbit: 0.01,
        pull: 0.1,
    },
    planet: {
        name: 'planet',
        images: [textures.planet1, textures.planet2, textures.planet3],
        height: 256,
        width: 256,
        orbit: 0.02,
        pull: 0.5,
    },
}

Object.keys(objectList).forEach(obj => {
    let div = document.createElement('div');
    div.classList.add('object-select');
    div.innerHTML = obj;
    div.addEventListener('click', () => {
        selectedObject = obj;
        document.querySelector('.selected')?.classList.remove('selected');
        div.classList.add('selected');
    })
    let img = document.createElement('img');
    img.classList.add('object-icon');
    img.src = assets[`${obj}_px`];
    div.appendChild(img);
    document.querySelector('#scroll-bar').appendChild(div);
})

function polarToRect(r, t) {
    let x = r * Math.cos(t);
    let y = r * Math.sin(t);
    return [x, y];
}

function rectToPolar(x, y) {
    let radius = Math.sqrt(x ** 2 + y ** 2);
    let theta = Math.atan(y / x);
    if(x < 0) {
        theta += Math.PI;
    }
    return [radius, theta];
}

class SpaceObject {
    constructor(name, image, height, width, x, y, orbit, pull) {
        this.dead = false;
        this.name = name;
        this.image = image;
        this.height = height;
        this.width = width;
        this.pos = [x, y];
        this.orbit = orbit;
        this.pull = pull;
        this.polar = rectToPolar(x, y);
        this.sprite = new Sprite(image, width, height);
        this.imgscale = width / image.width;
        this.scale = 1;
        this.sprite.scale.set(this.scale);
    }

    createSprite() {
        app.stage.addChild(this.sprite);
        this.update();
    }

    update() {
        this.polar[1] += this.orbit;
        this.polar[0] = Math.max(0, this.polar[0] - this.pull);
        if(this.polar[0] < 0.01) {
            this.destroy();
            return;
        }
        this.scale = this.polar[0] / 500;
        this.sprite.scale.set(this.scale * this.imgscale);
        this.pos = polarToRect(...this.polar);
        this.sprite.position.set(this.pos[0] - this.scale * this.width / 2 + screenWidth / 2, this.pos[1] - this.scale * this.height / 2 + screenHeight / 2);
    }

    destroy() {
        this.sprite.parent.removeChild(this.sprite);
        this.sprite.destroy();
        this.dead = true;
    }
}

function spawnObject(event) {
    if(selectedObject == 'none') {
        return;
    }
    let {x, y} = event.screen;
    let info = objectList[selectedObject];
    let image = info.images[Math.floor(Math.random() * info.images.length)];
    let newObject = new SpaceObject(info.name, image, info.height, info.width, x - screenWidth / 2, y - screenHeight / 2, info.orbit, info.pull);
    objects.push(newObject);
    newObject.createSprite();
}

let objects = [];

function drawSprites() {
    objects = objects.filter(a => a.dead == false);
    for(let i = 0; i < objects.length; i++) {
        let obj = objects[i];
        obj.update();
    }
    // app.stage.children.sort((a, b) => a.zIndex - b.zIndex);
}

app.ticker.add(drawSprites);

backgroundSprite.eventMode = 'static';
backgroundSprite.on('pointerdown', spawnObject);
