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
    this.decelerating = false;
    this.move = function(){
            // Check for any closed intersections ahead, soon to be cars too
            if(this.currentRoad){
                if(this.currentRoad.blockages.indexOf(this) < this.currentRoad.blockages.length - 1){
                    var obstacle = this.currentRoad.blockages[this.currentRoad.blockages.indexOf(this) + 1];
                    if(obstacle instanceof intersection && obstacle.flow == this.currentRoad.direction && !obstacle.yellow){
                        if(this.currentRoad.blockages.indexOf(this) == this.currentRoad.blockages.length - 2){
                            // obstacle is far far away
                            var obstacle = {x: 9999, y: 9999};
                        } else {
                            // ignore the open intersection, look for the next blockage
                            obstacle = this.currentRoad.blockages[this.currentRoad.blockages.indexOf(this) + 2];
                            var thisPos = (this.direction == 1 || this.direction == 3 ? this.y : this.x);
                            var obstaclePos = (this.direction == 1 || this.direction == 3 ? obstacle.y : obstacle.x);
                            if(obstaclePos - thisPos < 35){
                                // Car will block intersection if it proceeds, so reinstate original obstacle
                                obstacle = this.currentRoad.blockages[this.currentRoad.blockages.indexOf(this) + 1];
                            }
                            
                            
                        }
                    }
                    var thisPos = (this.direction == 1 || this.direction == 3 ? this.y : this.x);
                    var obstaclePos = (this.direction == 1 || this.direction == 3 ? obstacle.y : obstacle.x);
                    
                    if(thisPos > obstaclePos - 50){
                        // within acting distance of a car/intersection
                        // TODO do something special with yellow lights so cars don't stop suddenly if they are right next to intersection
                        // 
                        
                        var oldSpeed = this.speed;
                        var tempPos = obstaclePos;
                        if(obstacle instanceof intersection && obstacle.yellow && obstacle.flow == this.currentRoad.direction && !this.decelerating){
                            if(tempPos - thisPos - 7 < 15){
                                if(this.speed < .5){
                                    this.speed *= 1.5;
                                   if(this.speed > .5) this.speed = .5;
                                }
                            } else {
                                this.speed = (tempPos - thisPos - 9) / 70;
                            }
                        } else if(tempPos - thisPos - 7 < 35){
                            this.speed = (tempPos - thisPos - 9) / 70;
                        }
                        if(oldSpeed < this.speed){
                            // Accelerating
                            this.moving = true;
                            this.decelerating = false;
                        } else {
                            // Decellerating
                            if(this.speed < 0.05) this.moving = false;
                            this.decelerating = true;
                        }
                        
                    } else {
                        if(this.speed < .5){
                            this.speed += .025;
                           if(this.speed > .5) this.speed = .5;
                        } else {
                            this.speed = .5;
                        }
                        this.moving = true;
                    }
                } else {
                    if(this.speed < .5){
                        this.speed += .025;
                       if(this.speed > .5) this.speed = .5;
                    } else {
                        this.speed = .5;
                    }
                    this.moving = true;
                }
            
                var thisPos = (this.direction == 1 || this.direction == 3 ? this.y : this.x);
                var roadEnd = (this.currentRoad.direction == 1 ? this.currentRoad.y : this.currentRoad.x) + this.currentRoad.length;
                if(thisPos > roadEnd){
                    removeCar(this);
                    this.moving = false;
                }
            }
        
        if(this.moving){
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
    };
    this.intersections = [];
    this.findIntersections = function(){
        for(var l = 0; l < this.roads.length; l++){
            var thisRoad = this.roads[l];
            if(thisRoad.direction == 2) continue;
            for(var m = 0; m < this.roads.length; m++){
                if(l === m) continue;
                var tempRoad = this.roads[m];
                if(thisRoad.direction == 1){
                    if(thisRoad.direction == 1 && thisRoad.x > tempRoad.x && thisRoad.x < tempRoad.length + tempRoad.x && thisRoad.y < tempRoad.y && (thisRoad.y + thisRoad.length) > tempRoad.y){
                        var inter = new intersection(thisRoad.x, tempRoad.y, thisRoad, tempRoad);
                        if(this.intersections.indexOf(inter) == -1){
                            this.intersections.push(inter);
                            thisRoad.intersections.push(inter);
                            tempRoad.intersections.push(inter);
                        }
                    }
                }
            }
        }
    }
}

function road(placex, placey, direction, length){
    this.length = length;
    this.direction = (direction ? direction : 1); // 1 or 2 - up/down or left/right
    this.x = (placex ? placex : 0);
    this.y = (placey ? placey : 0);
    this.draw = function(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, (this.direction == 2 ? this.length: 15), (this.direction == 1 ? this.length: 15));
        ctx.fillStyle = "blue";
        ctx.fillRect(this.x, this.y, 15, 15);
        this.calculateBlockages();
    };
    this.cars = [];
    this.addCar = function(car, startPoint){
        car.currentRoad = this;
        car.x = this.x + (this.direction == 1 ? 0 : startPoint) + 7.5;
        car.y = this.y + (this.direction == 2 ? 0 : startPoint) + 7.5;
        car.direction = (this.direction == 1 ? 3 : 2);
        this.cars.push(car);
    };
    this.intersections = [];
    this.calculateBlockages = function(){
        this.blockages = [];
        var currentIntersection = 0;
        for(var k = 0; k < this.cars.length + this.intersections.length; k++){
            if(k < this.cars.length){
                this.blockages.push(this.cars[k]);
            } else {
                var inter = this.intersections[currentIntersection++];
                
            
                this.blockages.push(inter);
            
                
            }
        }
        this.blockages.sort(function(a, b){
            if(this.direction == 1){
                if(a.y < b.y){
                    return -1;
                } else {
                    return 1;
                }
            } else {
                if(a.x < b.x){
                    return -1;
                } else {
                    return 1;
                }
            }
        }.bind(this));
    };
    this.blockages = [];
}

function intersection(x, y, verticalRoad, horizontalRoad){
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.verticalRoad = verticalRoad;
    this.horizontalRoad = horizontalRoad;
    this.yellow = false;
    this.flow = 1;
    this.draw = function(ctx){
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = (this.yellow ? "yellow" : "lightgreen");
        if(this.flow == 1){
            ctx.fillRect(this.x + 3, this.y, this.width - 6, this.height);
        } else {
            ctx.fillRect(this.x, this.y + 3, this.width, this.height - 6);
        }
    };
    this.switch = function(){
        if(!this.yellow){
            this.yellow = true;
            setTimeout(function(){
                this.flow = (this.flow == 1 ? 2 : 1);
                this.yellow = false;
            }.bind(this), 1000);
        }
        
    };
}

function removeCar(car){
    numCars--;
    car.currentRoad.blockages.splice(car.currentRoad.blockages.indexOf(car), 1);
    car.currentRoad.cars.splice(car.currentRoad.cars.indexOf(car), 1);
    cars.splice(cars.indexOf(car), 1);
    delete(car);
}

function newCar(tempCar, tempRoad){
    cars.push(tempCar);
    numCars++;
    tempRoad.addCar(tempCar, 0);
}

var mainBlock = undefined;
var cars = new Array();
var numCars = 0;

$(function(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    
    mainBlock = new block();
    for(var j = 1; j < 5; j++){
        mainBlock.addRoad(new road(0, j * 100, 2, canvas.width)); 
    }
    for(var i = 1; i < 7; i++){
        mainBlock.addRoad(new road(i * 100, 0, 1, canvas.height)); 
    }
    
    
    for(var i = 0; i < numCars; i++){
        cars.push(new car());
    }   
    
    
    mainBlock.findIntersections();

    
    console.log(mainBlock);
    
    $("#canvas").click(function(event){
        for(var i = 0; i < mainBlock.intersections.length; i++){
            var inter = mainBlock.intersections[i];
            if(inter.x <= event.offsetX && event.offsetX <= inter.x + 15 && inter.y <= event.offsetY &&  event.offsetY <= inter.y + 15){
                inter.switch();
            }
        }
        
        for(var i = 0; i < mainBlock.roads.length; i++){
            var tempRoad = mainBlock.roads[i];
            if(tempRoad.x <= event.offsetX && event.offsetX <= tempRoad.x + 15 && tempRoad.y <= event.offsetY &&  event.offsetY <= tempRoad.y + 15){
                newCar(new car(), tempRoad);
            }
        }
    });
    

    setInterval(function(){
        ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
        mainBlock.draw(ctx, "#BADA55", "#FFFFFF");
        for(var i = 0; i < numCars; i++){
            cars[i].move();
            cars[i].draw(ctx);
        }
    }, 10);
    
    setInterval(function(){
        for(var i = 0; i < mainBlock.intersections.length; i++){
            var yes = Math.random();
            yes = Math.round(yes);
            if(yes){
                mainBlock.intersections[i].switch();
            }
        }
        
        for(var i = 0; i < mainBlock.roads.length; i++){
            var yes = Math.random();
            yes = Math.round(yes);
            if(yes){
                newCar(new car(), mainBlock.roads[i]);
            }
            
        }
        
    }, 2000);
});