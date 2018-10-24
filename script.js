/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

// prints "hi" in the browser's dev tools console
/* global Matter*/ 
var Engine = Matter.Engine,
    Vector = Matter.Vector,
    World = Matter.World,
    Bodies = Matter.Bodies
var engine = Engine.create(); 
engine.world.gravity.y = 0
var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
var angle = Math.PI/180 * 20
var sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
var grow = async t => {
    while(t.toplayer < 13){
        await sleep(3000)
        t.addLayer()
    }
}
var STrees = {
    list:[],
    update:function(){
        var pack = []
        STrees.list.forEach(tree=>{
            if(tree.needsUpdate) pack.push(tree.getUpdatePack())
        })
        return pack
    }
}
var CTrees = new Map()
class CBranch{
    constructor(pack){
        this.begin = pack.begin
        this.end = pack.end
        this.len = pack.len
    }
    show(){
        ctx.beginPath();
        ctx.lineWidth = 1 * this.len/50
        ctx.strokeStyle = 'saddlebrown'
        ctx.moveTo(this.begin.x, this.begin.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.stroke();
    }
}
class SBranch{
    constructor(begin, end, len){
        this.begin = begin
        this.end = end
        this.len = len
    }
    branchRight(){
        var dir = Vector.sub(this.end, this.begin)
        Vector.rotate(dir, Math.random() * (-Math.PI * 1/5), dir)
        dir = Vector.mult(dir, Math.random() * .05 + .9)
        var newEnd = Vector.add(dir, this.end)
        var right = new SBranch(this.end, newEnd, 0.9 * this.len)
        return right
    }
    branchLeft(){
        var dir = Vector.sub(this.end, this.begin)
        Vector.rotate(dir, Math.random() * (Math.PI * 1/5), dir)
        dir = Vector.mult(dir, Math.random() * .05 + .9)
        var newEnd = Vector.add(dir, this.end)
        var left = new SBranch(this.end, newEnd, 0.9 * this.len)
        return left
    }
}
class CTree {
    constructor(pack){
        var trunk = new CBranch({begin:{x:pack.x, y:pack.y}, end:{x:pack.x, y:pack.y - pack.baselen}, len:pack.baselen})
        this.layer1 = [trunk]
        this.layer2 = []
        this.id = pack.id
        pack.layer2.forEach(pack=>{
            this.layer2.push(new CBranch(pack))
        })
        this.leaves = pack.leaves
        this.toplayer = 2
        this.baselen = pack.baselen
        CTrees.set(this.id, this)
    }
    catchLayers(layers){
        for(var property in layers){
            this[property] = []
            layers[property].forEach((pack)=>{
                this[property].push(new CBranch(pack))
            })
        }
        this.toplayer++
        this.leaves = layers.leaves
    }
    show(){
        for(var i = 1; i < (this.toplayer+1); i++){
            this['layer'+i].forEach(branch => {
                //branch.end.x += Math.random() * 6 - 3
                //branch.end.y += Math.random() * 6 - 3
                branch.show()
            })
            
        }
        this.leaves.forEach(leaf => {
            ctx.beginPath();
            ctx.fillStyle = 'green'
            ctx.arc(leaf.x, leaf.y, this.baselen/10, 0, 2 * Math.PI);
            ctx.fill();
        }, this)
    }
}
class STree {
    constructor(x, y, baselen = 100){
        var trunk = new SBranch(Vector.create(x, y), Vector.create(x, y - baselen), baselen)
        this.x = x
        this.y = y
        this.id = Math.random()
        this.nlayer = 1
        this.layer1 = [trunk]
        this.layer2 = [trunk.branchLeft(), trunk.branchRight()]
        this.leaves = []
        this.layer2.forEach(branch => {
            var e = branch.end
            var leaf = Bodies.circle(e.x, e.y, baselen/10, {restitution:1, friction:1})
            leaf.parentBranch = branch
            this.leaves.push(leaf)
            World.addBody(engine.world, leaf)
        })
        this.toplayer = 2
        this.baselen = baselen
        this.needsUpdate = false
        grow(this)
        STrees.list.push(this)
    }
    addLayer(){
        if(this.toplayer < 9){
            this.needsUpdate = true
            var toplayer = this['layer' + this.toplayer];
            var nextlayer = this['layer' + (this.toplayer + 1)] = []
            toplayer.forEach(branch => {
                nextlayer.push(branch.branchRight())
                nextlayer.push(branch.branchLeft())
            })
            this.leaves.forEach(leaf => {
                World.remove(engine.world, leaf)
            })
            this.leaves = []
            nextlayer.forEach(branch => {
                var e = branch.end
                var leaf = Bodies.circle(e.x, e.y, this.baselen/10, {restitution:1, friction:1})
                leaf.parentBranch = branch
                this.leaves.push(leaf)
                World.addBody(engine.world, leaf)
            })
            //this.leaves = []
            this.toplayer++
        }
    }
    getUpdatePack(){
        var pack = {
            leaves:[]
        }
        this.leaves.forEach((leaf) => {
            pack.leaves.push({x:leaf.position.x, y:leaf.position.y})
        })
        for(var i = 1; i < (this.toplayer+1); i++){
            pack['layer' + i] = []
            this['layer'+i].forEach(branch => {
                pack['layer' + i].push({
                    begin:{x:branch.begin.x, y:branch.begin.y}, 
                    end:{x:branch.end.x, y:branch.end.y}, 
                    len:branch.len
                })
            })
        }
        this.needsUpdate = false
        return pack
    }
    getInitPack(){
        var pack = {
            layer2:[],
            x:this.x,
            y:this.y,
            baselen:this.baselen,
            leaves:[],
            id:this.id
        }
        this.leaves.forEach((leaf) => {
            pack.leaves.push({x:leaf.position.x, y:leaf.position.y})
        })
        for(var i = 1; i < (this.toplayer+1); i++){
            pack['layer' + i] = []
            this['layer'+i].forEach(branch => {
                //branch.end.x += Math.random() * 6 - 3
                //branch.end.y += Math.random() * 6 - 3
                pack['layer' + i].push({
                    begin:{x:branch.begin.x, y:branch.begin.y}, 
                    end:{x:branch.end.x, y:branch.end.y}, 
                    len:branch.len})
            })
            
        }
        return pack
    }
}
var tree
var ctree
var processUpdatePack = (packs) => {
    //document.write(pack[0].id)
    packs.forEach((pack) => {
        var toUpdate = CTrees.get(pack.id)
        //document.write(pack.leaves)
        toUpdate.catchLayers(pack)
    })
}
var setup = function(){
    //ctx.translate(canvas.width/2, canvas.height)
    tree = new STree(canvas.width/2, canvas.height/2, 30)
    ctree = new CTree(tree.getInitPack())
}
var draw = function(){
    Engine.update(engine)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    //var uppedTrees = STrees.update()
    if(tree.needsUpdate) ctree.catchLayers(tree.getUpdatePack())
    //if(uppedTrees.length > 0) processUpdatePack(uppedTrees)
    //ctree.catchLayers(tree.getUpdatePack())
    ctree.show()
}
window.onload = function(){
    setup()
    
    setInterval(draw, 1000/60)
}
