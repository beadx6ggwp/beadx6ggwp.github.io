
//----tool-------
function toRadio(angle) {
    return angle * Math.PI / 180;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}
function sleep(milliseconds) {
    var start = new Date().getTime();
    while (1)
        if ((new Date().getTime() - start) > milliseconds)
            break;
}
function minsecms() {
    var d = new Date();
    return `${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
}

/*
給定計算v在(n1,n2)佔的比例，換算到(m1,m2)中
n1|-----V------------|n2
m1|----------X----------------m2
*/
function Ratio(v, n1, n2, m1, m2) {
    if (v < n1 || v > n2) return 0;//V 不在n1~n2中
    var x = 0;
    x = (v * (m2 - m1) - n1 * m2 + n2 * m1) / (n2 - n1);
    return x;
}

/**
 * Retrieves a value from an object.
 *
 * @param {object} source - The object to retrieve the value from.
 * @param {string} key - The name of the property to retrieve from the object. If a property is nested, the names of its preceding properties should be separated by a dot (`.`) - `banner.hideBanner` would return the value of the `hideBanner` property from the object stored in the `banner` property of the `source` object.
 * @param {*} defaultValue - The value to return if the `key` isn't found in the `source` object.
 *
 * @return {*} The value of the requested key.
 */
function GetValue(source, key, defaultValue) {
    if (source.hasOwnProperty(key)) {
        return source[key];
    }
    else if (key.indexOf('.') !== -1) {
        var keys = key.split('.');
        var parent = source;
        var value = defaultValue;

        //  Use for loop here so we can break early
        for (var i = 0; i < keys.length; i++) {
            if (parent.hasOwnProperty(keys[i])) {
                //  Yes it has a key property, let's carry on down
                value = parent[keys[i]];

                parent = parent[keys[i]];
            }
            else {
                //  Can't go any further, so reset to default
                value = defaultValue;
                break;
            }
        }

        return value;
    }
    else {
        return defaultValue;
    }
}