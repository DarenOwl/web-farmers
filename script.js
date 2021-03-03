const states = [
    {name: "seeds", minage: 0},
    {name: "sprouts", minage: 15},
    {name: "young", minage: 40},
    {name: "middle", minage: 70},
    {name: "ready", minage: 100}
]
const keys = { left: 37, up: 38, right: 39, down: 40, w: 87, a: 65, s: 83, d: 68, e: 69 };

let map = {size: 8, left: 0, top: 0, right: 0, bottom: 0};
let array = [];
let controls = {left: false, up: false, right: false, down: false};
let player = null;

document.addEventListener("DOMContentLoaded", Init);
document.addEventListener('keydown',keyPressed);
document.addEventListener('keyup',keyRelesed);

function keyPressed(e) {
    if (e.keyCode == keys.up || e.keyCode == keys.w) {
        controls.up = true;
    } else if (e.keyCode == keys.down || e.keyCode == keys.s) {
        controls.down = true;
    } else if (e.keyCode == keys.left || e.keyCode == keys.a) {
        controls.left = true;
    } else if (e.keyCode == keys.right || e.keyCode == keys.d) {
        controls.right = true;
    } else if (e.keyCode == keys.e) {
        player.action();         
    } 
}

function keyRelesed(e) {
    if (e.keyCode == keys.up || e.keyCode == keys.w) {
        controls.up = false;
    } else if (e.keyCode == keys.down || e.keyCode == keys.s) {
        controls.down = false;
    } else if (e.keyCode == keys.left || e.keyCode == keys.a) {
        controls.left = false;
    } else if (e.keyCode == keys.right || e.keyCode == keys.d) {
        controls.right = false;
    }
}

function Init() {
    let mapDiv = document.getElementById("map");
    let game = document.getElementById("game");
    //resize map
    var resizeToSquare = new ResizeObserver(entries => {
        for (let entry of entries) {
            entry.target.style.height = entry.contentRect.width + "px";
        }
        onMapSizeChanged(mapDiv);
    });
    resizeToSquare.observe(mapDiv);
    mapDiv.style.height = mapDiv.offsetWidth + "px";

    //add plants
    generateField(mapDiv);
    //add villager
    villagerDOM = createObject.villager();
    game.appendChild(villagerDOM);
    player = new Villager(villagerDOM);
    //add compost
    document.getElementById("composts").appendChild(createObject.compost())

    let harvestIntervalID = setInterval(plantsGrowingTick,200);
    window.requestAnimationFrame(() => moveVillager(player));
    setTimeout(function() {
        clearInterval(harvestIntervalID);
    }, 20000);
}

function onMapSizeChanged(mapDiv) {
    let rect = mapDiv.getBoundingClientRect(); 
    player.speed = (rect.width/map.size)/16;
    player.x = rect.left;
    player.y = rect.top;
    player.dom.style.left = player.x  + "px";
    player.dom.style.top = player.y  + "px";
    player.blick();
    map.left = rect.left;
    map.top = rect.top;
    map.right = rect.right;
    map.bottom = rect.bottom;
}

function generateField(mapDiv) {
    array = [map.size];
    for (let x = 0; x < map.size; x++) {
        let row = document.createElement("tr");
        array[x] = [map.size];
        for (let y = 0; y < map.size; y++) {
            let cell = document.createElement("td");            
            row.appendChild(cell);
            array[x][y] = new Farmland(new Plant(Math.round(Math.random() * 100)), cell);
        };
        mapDiv.appendChild(row);
    }
}

const createObject = {
    villager: function() {
        let villager = document.createElement("img");
        villager.src = "res/villager_scythe.png";
        villager.className = "villager";
        villager.id = "player";
        return villager;
    },

    compost: function() {
        let compost = document.createElement("img");
        compost.src = "res/compost.png";
        compost.className = "compost";
        compost.id = "compost";
        compost.interact = interactions.fillcompost;
        return compost;
    }
};

const interactions = {
    harvest: function(villager, farmland) {
        farmland.harvest(villager);
    },

    fillcompost: function(villager, compost) {   
        let count = villager.takeAll();
        villager.score += count;
        console.log("score: " + villager.score);
    }
};

function plantsGrowingTick() {
    for (let x = 0; x < map.size; x++) {
        for (let y = 0; y < map.size; y++) {
            let farmland = array[x][y];
            farmland.grow();
        };
    }
}

function moveVillager(villager) {
    let dx = 0;
    let dy = 0;
    if (controls.up && villager.y > map.top - (villager.dom.offsetHeight * 0.8)){
        dy = -1;
    }
    if (controls.right && villager.x < map.right - (villager.dom.offsetWidth/2)) {
        dx = 1;
    }
    if (controls.down && villager.y < map.bottom - (villager.dom.offsetHeight * 0.8)) {
        dy = 1;
    }
    if (controls.left && villager.x > map.left - (villager.dom.offsetWidth/2)) {
        dx = -1;
    }
    villager.move(dx, dy);    
    window.requestAnimationFrame(() => moveVillager(villager));
}

class Villager {
    constructor(domImg) {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.inventory = 0;
        this.inventoryLimit = 8;
        this.score = 0;
        this.dom = domImg;
    }

    canTake(count) {
        return this.inventory + count <= this.inventoryLimit;
    }

    give(count) {
        if (this.inventory + count <= this.inventoryLimit) {
            this.inventory += count;
            this.dom.src = "res/villager_backpack.png";
        }
    }

    takeAll() {
        let count = this.inventory;
        this.inventory = 0;
        this.dom.src = "res/villager_scythe.png";
        return count;
    }

    move(dx, dy) {
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        this.dom.style.left = this.x + "px";
        this.dom.style.top = this.y + "px";
    }

    action() {
        let rect = this.dom.getBoundingClientRect();
        let x = rect.left + this.dom.offsetWidth/2;
        let y = rect.top + this.dom.offsetHeight + 1;
        let topElement=document.elementFromPoint(x,y);
        if (topElement.interact != undefined && topElement.interact != null) {
            topElement.interact(this);
        }   
    }

    blick() {
        this.dom.className = "villager blicking";
        setTimeout(() => {this.dom.className = "villager";},500)
    }
}

class Farmland {
    constructor(plant, mapCell) {
        this.plant = plant;
        this.dom = mapCell;

        let flag = document.createElement("img");
        flag.src = "res/flag.png";
        flag.className = "flag";
        this.dom.appendChild(flag);
        this.readyFlag = flag;

        flag.interact = (villager) => interactions.harvest(villager,this);
        this.dom.interact = (villager) => interactions.harvest(villager,this);
    }

    harvest(villager) {
        if (villager.canTake(1)) {
            this.dom.className = states[0].name;
            this.readyFlag.className = "flag";
            if (this.plant.ready) {
                villager.give(1);
            }
            this.plant.harvest();
        }
    }

    grow() {
        this.plant.grow();
        states.forEach(state => {
            if (this.plant.age >= state.minage) {
                this.dom.className=state.name;
            }
        });
        if (this.plant.ready) {
            this.readyFlag.className ="flag active"
        }
    }
}

class Plant {
    constructor(age) {
        this.age = age;
        this.ready = age >= 100;        
    }

    grow() {
        if (this.ready)
            return;

        this.age++;        
        if (this.age == 100)
            this.ready = true;
    }

    harvest() {
        this.age = 0;
        this.ready = false;
    }
}