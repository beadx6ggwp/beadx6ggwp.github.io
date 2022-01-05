function Cell(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.locX = x * size;
    this.locY = y * size;

    this.neighborCount = 0;
    this.bee = random(0, 100) < 85 ? 0 : 1;
    this.statue = 0; // 0:back, 1:show, 2:
}




Cell.prototype.Show = function () {
    // 正面
    if (this.statue == 1) {
        // 炸彈
        if (this.bee == 1) {
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "#F77";
            ctx.beginPath();
            ctx.arc(sx + this.locX + this.size / 2,
                sy + this.locY + this.size / 2,
                this.size / 4,
                0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        // 提示
        else {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(sx + this.locX, sy + this.locY, this.size, this.size);
            if (this.neighborCount > 0) {
                ctx.textAlign = "center";
                ctx.fillStyle = "#000";
                ctx.font = size / 2 + "px " + "Consolas";
                ctx.fillText(this.neighborCount,
                    sx + this.locX + this.size / 2,
                    sy + this.locY + this.size / 2);
            }
        }
    }
    // 背面
    else {
        ctx.fillStyle = "#7BF";
        ctx.fillRect(sx + this.locX, sy + this.locY, this.size, this.size);

    }
    ctx.strokeStyle = "#000";
    ctx.strokeRect(sx + this.locX, sy + this.locY, this.size, this.size);
}