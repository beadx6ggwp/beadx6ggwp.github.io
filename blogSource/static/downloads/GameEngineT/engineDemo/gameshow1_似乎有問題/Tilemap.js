class TileMap {
    constructor(world, config) {
        this.world = world;

        this.rows = GetValue(config, 'rows', 0);
        this.cols = GetValue(config, 'cols', 0);
        this.tileWidth = GetValue(config, 'tileWidth', 0);
        this.tileHeight = GetValue(config, 'tileHeight', 0);

        this.layers = GetValue(config, 'layers', {});
        this.collision = GetValue(config, 'collision', {});
        this.tileset = GetValue(config, 'tileset', {});

        this.tileList = [];

        this.addToRenderList();
    }

    addToRenderList() {
        let tw = this.tileWidth;
        let th = this.tileHeight;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // 0502-1
                /*
                (x,y)________
                    |       |
                    |   +   |
                    |_______|
                center(+) = x + tw / 2, y + th / 2
                因為entity是從中新開始渲染
                */
                let x = (col * tw) + tw / 2;
                let y = (row * th) + th / 2;
                for (let i = 0; i < this.layers.length; i++) {
                    let layer = this.layers[i];
                    let tileIndex = this.getTileWithLayer(i, row, col) - 1;
                    if (tileIndex < 0) continue;
                    let tileConfig = {
                        name: 'tile',
                        pos: { x: x, y: y },
                        tileWidth: tw,
                        tileHeight: th,
                        zindex: layer.zindex,
                        animation: this.tileset[layer.setName]
                    }
                    let tile = new Tile(tileConfig);
                    tile.animation.currentFrame = tileIndex;
                    this.world.addGameObj(tile);
                    // this.tileList.push(entity);
                }
            }
        }
    }

    getTileWithLayer(layer, row, col) {
        let index = row * this.cols + col;
        return this.layers[layer].data[index];
    }
    getCollisionTile(row, col) {
        let index = row * this.cols + col;
        return this.collision.data[index];
    }

    drawMapWithCamera(ctx, camera) {
        let tw = this.tileWidth;
        let th = this.tileHeight;

        let start = {
            x: Math.max(0, Math.floor(camera.renderPos.x / tw)),
            y: Math.max(0, Math.floor(camera.renderPos.y / th))
        }
        let end = {
            x: Math.min(Math.floor((camera.renderPos.x + camera.width) / tw + 1), this.cols),
            y: Math.min(Math.floor((camera.renderPos.y + camera.height) / th + 1), this.rows)
        }

        for (let row = start.y; row < end.y; row++) {
            for (let col = start.x; col < end.x; col++) {
                let x = (col * tw);
                let y = (row * th);
                for (let i = 0; i < this.layers.length; i++) {
                    let layer = this.layers[i];
                    let img = asset.imgs[this.tileset[layer.setName].imgName];
                    let framesPerRow = img.width / tw;
                    let tile = this.getTileWithLayer(i, row, col);
                    let index = tile - 1;

                    let col2 = Math.floor(index % framesPerRow);
                    let row2 = Math.floor(index / framesPerRow);

                    let sw = tw,
                        sh = th;
                    let sx = col2 * sw,
                        sy = row2 * sh;
                    let dw = sw,
                        dh = sh;

                    ctx.drawImage(
                        img,
                        sx, sy, sw, sh,
                        x, y, dw, dh
                    );
                }
            }
        }
    }
}

class Tile extends Entity {
    constructor(config) {
        super(config);

        this.tileWidth = GetValue(config, 'tileWidth', 0);
        this.tileHeight = GetValue(config, 'tileHeight', 0);
        this.collider = {
            pos: this.pos,
            w: this.tileWidth,
            h: this.tileHeight
        };
    }

    checkInView(camera) {
        // let box1 = camera.getCollisionBox();
        // let box2 = new Box(this.pos.x, this.pos.y, this.tileWidth, this.tileHeight);
        // return rect2rect(box1, box2)

        // return rect2rect(camera.collider, this.collider);
        // 這樣看起來也不吃效能，跟下面的寫法效能一樣，所以可以得知要盡量避免new出一次性的物件

        // 目前這樣比較不會吃效能(GC)，所以tile不需要renderBox判斷是否在顯示範圍，直接判斷即可
        // 而checkInView可能從camera改放在entity中比較好，根據不同物件處理不同的可視判斷

        // 因為pos為中心，所以要算最左邊最右邊需要+/- tileWidth/2
        let tw = this.tileWidth / 2;
        let th = this.tileHeight / 2;
        // debugger
        if (this.pos.x + tw < camera.pos.x || this.pos.x - tw > camera.pos.x + camera.width ||
            this.pos.y + th < camera.pos.y || this.pos.y - th > camera.pos.y + camera.height) {
            return false;
        }
        return true;
    }
}

// 想法:玩家是否跟collision layer物件同層數，player.zindx/10、layer.zindex/10，比對10位數是否相等即可

class TileMap2 {
    constructor(world, config) {
        this.config = config;
        this.world = world;

        this.type = GetValue(config, 'type', 'map');
        this.rows = GetValue(config, 'height', 0);
        this.cols = GetValue(config, 'width', 0);
        this.tileheight = GetValue(config, 'tileheight', 0);
        this.tilewidth = GetValue(config, 'tilewidth', 0);

        this.tilesetData = GetValue(config, 'tilesets', null);
        this.tilesets = {};
        this.firstgidList = [];
        for (const sets of this.tilesetData) {
            let sourse = asset.jsons[sets.source.split('.')[0]];
            this.tilesets[sets.firstgid.toString()] = new Tileset(world, sourse)
            this.firstgidList.push(sets.firstgid)
        }

        // 初始化layer data
        let layerData = GetValue(config, 'layers', [])
        this.layers = [];
        for (let i = 0; i < layerData.length; i++) {
            const layer = layerData[i];
            if (layer.type == 'group') {
                this.layers.push(new Layer(world, this, layer, i))
            }
        }

        let cols = this.cols, rows = this.rows;
        let tw = this.tilewidth, th = this.tileheight;
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if (layer['objectlayer']) {
                for (const obj of layer['objectlayer']) {
                    let objConf = createMapObjectConfig(obj);
                    world.addGameObj(new Entity(objConf))
                }
            }
            if (layer['tilelayer']) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        let x = (col * tw) + tw / 2;
                        let y = (row * th) + th / 2;

                        let tileIndex = this.getTileWithLayer(layer.layerIndex, row, col);
                        if (tileIndex <= 0) continue;
                        let nowSet = -1;
                        // if(tileIndex>=57)debugger
                        for (let i = 0; i < this.firstgidList.length; i++) {
                            if (tileIndex >= this.firstgidList[i]) nowSet = this.firstgidList[i];
                        }
                        // 歸位新圖片的取得索引
                        let imgIndex = tileIndex - nowSet;// -1

                        let tiles = this.tilesets[nowSet].tiles;
                        let aniseq = `${imgIndex}-${imgIndex}`;
                        let speed = 0;
                        if (tiles && tiles[imgIndex]) {
                            let ani = tiles[imgIndex].animation;
                            if (ani) {
                                aniseq = ani.sequence.join(',');
                                speed = ani.speed;
                            }
                        }
                        let tileConfig = {
                            name: 'tile',
                            pos: { x: x, y: y },
                            collisionToMap: false,
                            tileWidth: tw,
                            tileHeight: th,
                            zindex: layer.zindex,
                            animation: {
                                frameWidth: tw,
                                frameHeight: th,
                                renderScale: 1,
                                imgName: this.tilesets[nowSet].imgName,
                                speed: speed,
                                action: {
                                    'default': aniseq
                                },
                            }
                        }
                        // debugger
                        let tile = new Tile(tileConfig);
                        // tile.animation.currentFrame = imgIndex;
                        this.world.addGameObj(tile);
                        // this.tileList.push(entity);
                    }
                }
            }

        }
    }
    getTileWithLayer(layer, row, col) {
        if (!this.layers[layer]['tilelayer']) return 0

        let index = row * this.cols + col;
        return this.layers[layer]['tilelayer'][index];
    }
    getTileCollisionWithLayer(layer, row, col) {
        if (!this.layers[layer]['collision']) return 0;

        let index = row * this.cols + col;
        return this.layers[layer]['collision'][index];
    }
}

class Tileset {
    constructor(world, config) {
        this.config = config;
        this.world = world;

        let imgPath = GetValue(config, 'image', null)
        this.imgName = imgPath.split('.')[0];

        this.tilewidth = GetValue(config, 'tilewidth', 0)
        this.tileheight = GetValue(config, 'tileheight', 0)
        this.tilecount = GetValue(config, 'tilecount', 0)

        let tileData = GetValue(config, 'tiles', null)
        if (tileData != null) {
            this.tiles = {};
            for (const tile of tileData) {
                let objs = {};
                if (tile['objectgroup']) {
                    objs.collisions = [];
                    for (const obj of tile['objectgroup']['objects']) {
                        let objConf = createMapObjectConfig(obj);
                        // objConf.collider.offset = { x: obj.x, y: obj.y };
                        // debugger
                        objs.collisions.push(new Entity(objConf))
                    }
                }
                if (tile['animation']) {
                    objs.animation = { sequence: [], speed: 0 };
                    for (const obj of tile.animation) {
                        objs.animation.sequence.push(obj['tileid'])
                    }
                    objs.animation.speed = 1000 / tile['animation'][0]['duration']
                }
                this.tiles[tile.id.toString()] = objs;
            }
        }
    }
}

// 每層一個layer data: default、collision、object
class Layer {
    constructor(world, tilemap, group, layerIndex) {
        this.world = world;
        this.tilemap = tilemap;

        this.name = group.name;
        this.layerIndex = layerIndex;
        this.zindex = layerIndex * 10;

        for (const layer of group.layers) {
            this[layer.name] = layer.data || layer.objects
        }
    }
}

function createMapObjectConfig(object) {
    let objConfig = {
        name: 'layerObj',
        pos: { x: 0, y: 0 },
        collisionToMap: false,
        hitActionData: {
            parent: this,
            target: ['player','enemy1'],
            action: function (ent1, ent2) {
                // debugger
                let collider1 = ent1.getCollisionBox();
                let collider2 = ent2.getCollisionBox();
                // debugger
                if (!box2box(collider1.getBoundingBox(), collider2.getBoundingBox())) return;
                let mtv = collider1.collideWith(collider2);
                if (mtv.axis) {
                    let v = separate(collider1, collider2, mtv)
                    ent2.pos.add(v);
                    mtvBounce(ent2, mtv)
                }
            }
        },
        drawBase: true
    }
    if (object.ellipse) {
        // debugger
        let r = object.width / 2;
        // center
        objConfig.collider = {
            radius: r,
            offset: { x: object.x + r, y: object.y + r }
        }

        return objConfig;
    }

    if (object.polygon) {
        objConfig.collider = {
            polygon: object.polygon,
            offset: { x: object.x, y: object.y }
        }
        return objConfig;
    }


    let w = object.width;
    let h = object.height;

    objConfig.collider = {
        polygon: [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }],
        offset: { x: object.x + w / 2, y: object.y + h / 2 }
    }
    return objConfig;
}

class Tile2 extends Entity {
    constructor(config) {
        super(config)
        this.tilewidth = GetValue(config, 'tileWidth', 0);
        this.tileheight = GetValue(config, 'tileHeight', 0);

    }
    getRenderBox() {

    }
}