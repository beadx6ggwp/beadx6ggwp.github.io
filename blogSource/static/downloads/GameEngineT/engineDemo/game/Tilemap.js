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