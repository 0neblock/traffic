function car() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.speed = .5;
    this.direction = 1;
    this.currentRoad = undefined;
    this.draw = function(ctx){
        ctx.beginPath();
        ctx.arc(this.x,this.y,5,0,2*Math.PI);
        ctx.stroke();
    };
    this.moving = true;
    this.move = function(){
        if(this.moving){
            if(this.currentRoad){
                for(var k = 0; k < this.currentRoad.intersections.length; k++){
                    var inter = this.currentRoad.intersections[k];
                    switch(this.direction){
                        case 2:
                            if(inter.x - this.x - 7 < 35){
                                this.speed = (inter.x - this.x - 7) / 70;
                                if(this.speed < 0.05) this.moving = false;

                            }
                        break;
                    }
                }
            }
        
            this.x = (this.direction == 1 || this.direction == 3 ? this.x : (this.direction == 2 ? this.x += this.speed : this.x -= this.speed));
            this.y = (this.direction == 2 || this.direction == 4 ? this.y : (this.direction == 1 ? this.y -= this.speed : this.y += this.speed));
        }
    };
}

function block(){
    this.width = canvas.width / 2;
    this.height = canvas.height / 2;
    this.x = 0;
    this.y = 0;
    this.draw = function(ctx, color, roadColor){
        ctx.fillStyle = color;
        ctx.fillRect(this.x,this.y,canvas.width,canvas.height);
        for(var k = 0; k < this.roads.length; k++){
            this.roads[k].draw(ctx, roadColor);
        }
        for(var k = 0; k < this.intersections.length; k++){
            this.intersections[k].draw(ctx);
        }
    }
    this.roads = [];
    this.addRoad = function(road){
        this.roads.push(road);
        this.findIntersections();
    };
    this.intersections = [];
    this.findIntersections = function(){
        for(var l = 0; l < this.roads.length; l++){
            var thisRoad = this.roads[l];
            for(var m = 0; m < this.roads.length; m++){
                if(l == m) continue;
                var tempRoad = this.roads[m];
                if(thisRoad.direction != tempRoad.direction){
                    if(thisRoad.direction == 1 && thisRoad.x > tempRoad.x && thisRoad.x < tempRoad.length && thisRoad.y < tempRoad.y && (thisRoad.y + thisRoad.length) > tempRoad.y){
                        var inter = new intersection(thisRoad.x, tempRoad.y, thisRoad, tempRoad);
                        this.intersections.push(inter);
                        thisRoad.intersections.push(inter);
                        tempRoad.intersections.push(inter);
                    }
                }
            }
        }
    }
}

function road(placex, placey, direction){
    this.length = 300;
    this.direction = (direction ? direction : 1); // 1 or 2 - up/down or left/right
    this.x = (placex ? placex : 0);
    this.y = (placey ? placey : 0);
    this.draw = function(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, (this.direction == 2 ? this.length: 15), (this.direction == 1 ? this.length: 15));
    };
    this.addCar = function(car, startPoint){
        car.currentRoad = this;
        car.x = this.x + (this.direction == 1 ? 0 : startPoint) + 7.5;
        car.y = this.y + (this.direction == 2 ? 0 : startPoint) + 7.5;
        car.direction = (this.direction == 1 ? 3 : 2);
    };
    this.intersections = [];
}

function intersection(x, y, verticalRoad, horizontalRoad){
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.verticalRoad = verticalRoad;
    this.horizontalRoad = horizontalRoad;
    this.draw = function(ctx){
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


$(function(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    
    var cars = new Array();
    var numCars = 1;
    
    var mainBlock = new block();
    mainBlock.addRoad(new road(100, 250, 2));
    mainBlock.addRoad(new road(200, 150, 1));
    
    for(var i = 0; i < numCars; i++){
        cars.push(new car());
    }   
    
    mainBlock.roads[0].addCar(cars[0], 0);

    
    mainBlock.draw(ctx, "#BADA55", "#EFEFEF");
    console.log(mainBlock);
    
    
    

    setInterval(function(){
        ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
        mainBlock.draw(ctx, "#BADA55", "#EFEFEF");
        for(var i = 0; i < numCars; i++){
            cars[i].move();
            cars[i].draw(ctx);
        }
    }, 10);
});

