// core setting
var gameConfig = {
    width: 1000,
    height: 750,
    canvasOnCenter: 1,
    renderScale: { x: 1, y: 1 },
    updateStep: 1 / 60 // 更新頻率太低會導之碰撞回饋抖動
}

// asset src setting
// 設定資訊，name : path
var assetSource = {
    imgs: {
        'player': 'asset/img/ani1.png',
        'player2': 'asset/img/ani2.png',
        'tilecolor': 'asset/img/tilecolor.png',
        'coin': 'asset/img/coin.png',
        'robin': 'asset/img/robin.png',
        'swoosh': 'asset/img/swoosh.png',
        'tileset': 'asset/img/tileset.png',
        'player3': 'asset/img/adventurer-v1.5-Sheet-new.png',
        'Overworld': 'asset/tile/Overworld.png'
        // 'imgtest1':'http://127.0.0.1:8080/'
        // 'ttt':'https://i.imgur.com/Ih4eMyv.gif',
        // 'ttt2':'https://i.imgur.com/ssZ6BcJ.gif'
    },
    sounds: {

    },
    jsons: {
        'testJSON': 'asset/data/testJSON.json',
        'untitled': 'asset/data/test2/untitled.json',
        'tileset': 'asset/data/test2/tileset.json',
        'tilecolor': 'asset/data/test2/tilecolor.json',
        'map_2': 'asset/tile/map_2.json',
        'Overworld': 'asset/tile/Overworld.json'
    }
};

var Tile_Data

// animation sitting
// 按照固定格式設定即可，指定單張跳格撥放'1,3,4,5,7'，連續'0-10'
var player1Animation = {
    frameWidth: 17,
    frameHeight: 25,
    renderScale: 2,
    imgName: 'player',
    speed: 15,
    action: {
        'walk-up': '10,11,12,13,12,11,10,9,8,7,8,9',
        'walk-down': '3,4,5,6,5,4,3,2,1,0,1,2',
        'walk-left': '24,25,26,27,26,25,24,23,22,21,22,23',
        'walk-right': '17,18,19,20,19,18,17,16,15,14,15,16',
        'stand-up': '10',
        'stand-down': '3',
        'stand-left': '24',
        'stand-right': '17',
        'default': '3'
    }
};
var player3Animation = {
    frameWidth: 350 / 7,
    frameHeight: 592 / 16,
    renderScale: 2,
    imgName: 'player3',
    speed: 10,
    action: {
        'idle1': '0-3',
        'walk': '8-13',
        'atk1': '42-46',
        'atk2': '47-52',
        'atk3': '53-58',
        'default': '0'
    }
};
var robinAnimation = {
    frameWidth: 1200 / 5,
    frameHeight: 1570 / 5,
    renderScale: 1 / 7,
    imgName: 'robin',
    speed: 15,
    repeat: true,
    action: {
        'default': '0-21'
    }
}
var coinAnimation = {
    frameWidth: 44,
    frameHeight: 40,
    renderScale: 1 / 2,
    imgName: 'coin',
    speed: 15,
    repeat: true,
    action: {
        'default': '0-9'
    }
}
var swordAnimation = {
    frameWidth: 128 / 4,
    frameHeight: 32,
    renderScale: 1.5,
    imgName: 'swoosh',
    speed: 25,
    repeat: false,
    action: {
        'default': '0-3'
    }
}