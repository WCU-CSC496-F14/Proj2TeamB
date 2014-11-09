// # Quintus platformer example
//
// [Run the example](../quintus/examples/platformer/index.html)
// WARNING: this game must be run from a non-file:// url
// as it loads a level json file.
//
// This is the example from the website homepage, it consists
// a simple, non-animated platformer with some enemies and a 
// target for the player.
window.addEventListener("load",function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.

var Q = window.Q = Quintus({ audioSupported: [ 'mp3','ogg' ] })//{audioSupported: ['mp3']}
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio")

        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true })
        // And turn on default input controls and touch input (for UI)
        .controls().touch().enableSound();//

// ## Player Sprite
// The very basic player sprite, this is just a normal sprite
// using the player sprite sheet with default controls added to it.
Q.Sprite.extend("Player",{

  // the init constructor is called on creation
  init: function(p) {

    // You can call the parent's constructor with this._super(..)
    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      x: 90,           // You can also set additional properties that can
      y: 1000,          // be overridden on object creation
      direction: "right"
    });

    // Add in pre-made components to get up and running quickly
    // The `2d` component adds in default 2d collision detection
    // and kinetics (velocity, gravity)
    // The `platformerControls` makes the player controllable by the
    // default input actions (left, right to move,  up or action to jump)
    // It also checks to make sure the player is on a horizontal surface before
    // letting them jump.
    this.add('2d, platformerControls');

    // Write event handlers to respond hook into behaviors.
    // hit.sprite is called everytime the player collides with a sprite
    this.on("hit.sprite",function(collision) {

      // Check the collision, if it's the Tower, you win!
      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });

	this.on("jump");
    this.on("jumped");

  },
  
  jump: function(obj) {
    // Only play sound once.
    if (!obj.p.playedJump) {
      Q.audio.play('jump.mp3');
      obj.p.playedJump = true;
    }
  },

  jumped: function(obj) {
    obj.p.playedJump = false;
  },
  
  step: function(dt) {
    var processed = false;
      
    if(!processed) { 
      this.p.gravity = 1;

        if(this.p.vx > 0) {
          if(this.p.landed > 0) {
            this.play("walk_right");
          } else {
            this.play("jump_right");
          }
          this.p.direction = "right";
        } else if(this.p.vx < 0) {
          if(this.p.landed > 0) {
            this.play("walk_left");
          } else {
            this.play("jump_left");
          }
          this.p.direction = "left";
        } else {
          this.play("stand_" + this.p.direction);
        }
    }
  }

});


// ## Tower Sprite
// Sprites can be simple, the Tower sprite just sets a custom sprite sheet
Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

// ## Enemy Sprite
// Create the Enemy class to add in some baddies
Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy', vx: 100 });

    // Enemies use the Bounce AI to change direction 
    // whenver they run into something.
    this.add('2d, aiBounce');

    // Listen for a sprite collision, if it's the player,
    // end the game unless the enemy is hit on top
    this.on("bump.left,bump.right,bump.bottom",function(collision) {
      if(collision.obj.isA("Player")) { 
        Q.stageScene("endGame",1, { label: "You Died" }); 
        collision.obj.destroy();
      }
    });

    // If the enemy gets hit on the top, destroy it
    // and give the user a "hop"
    this.on("bump.top",function(collision) {
      if(collision.obj.isA("Player")) { 
        this.destroy();
        Q.audio.play('killenemy.mp3');
        collision.obj.p.vy = -300;
      }
    });
  }
});

// ## Level1 scene
// Create a new scene called level 1
Q.scene("level1",function(stage) {

  // Add in a repeater for a little parallax action
  stage.insert(new Q.Repeater({ asset: "cavebackground.png", speedX: 0.5, speedY: 0.5 }));

  // Add in a tile layer, and make it the collision layer
  stage.collisionLayer(new Q.TileLayer({
                             dataAsset: 'level.json',
                             sheet:     'tiles' }));


  // Create the player and add them to the stage
  var player = stage.insert(new Q.Player());

  // Give the stage a moveable viewport and tell it
  // to follow the player.
  stage.add("viewport").follow(player);
  stage.viewport.scale = 2;

  // Add in a couple of enemies
  stage.insert(new Q.Enemy({ x: 500, y: 1000 }));
  stage.insert(new Q.Enemy({ x: 700, y: 1000 }));
  stage.insert(new Q.Enemy({ x: 600, y: 900 }));
  stage.insert(new Q.Enemy({ x: 300, y: 950 }));
  stage.insert(new Q.Enemy({ x: 700, y: 700 }));
  stage.insert(new Q.Enemy({ x: 600, y: 400 }));
  stage.insert(new Q.Enemy({ x: 500, y: 700 }));

  // Finally add in the tower goal
  //stage.insert(new Q.Tower({ x: 180, y: 50 }));
});

// To display a game over / game won popup box, 
// create a endGame scene that takes in a `label` option
// to control the displayed message.
Q.scene('endGame',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#FFFFFF",
                                                  label: "Play Again" }))         
  var label = container.insert(new Q.UI.Text({x:10, y: -20 - button.p.h, 
                                                   label: stage.options.label, color: "white" }));
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });

  // Expand the container to visibily fit it's contents
  // (with a padding of 20 pixels)
  container.fit(20);
});

Q.scene('title',function(stage) {
  // Add in a repeater for a little parallax action
  stage.insert(new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 }));

  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#FFFFFF",
                                                  label: "Play" }))         
  var label = container.insert(new Q.UI.Text({x:10, y: -20 - button.p.h, 
                                                   label: stage.options.label, color: "white" }));
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });

  // Expand the container to visibily fit it's contents
  // (with a padding of 20 pixels)
  container.fit(20);
  
  stage.add("viewport").follow(container);
  stage.viewport.scale = 2;
});

// ## Asset Loading and Game Launch
// Q.load can be called at any time to load additional assets
// assets that are already loaded will be skipped
// The callback will be triggered when everything is loaded

Q.load("spritesheet.png, sprites.json, level.json, newtiles.png, cavebackground.png, Rick-astley.mp3, killenemy.mp3, jump.mp3",  function() {//["Rick-astley.mp3"],

  // Sprites sheets can be created manually
  Q.sheet("tiles","newtiles.png", { tilew: 32, tileh: 32 });
//Q.audio.play("Rick-astley.mp3",{ loop: true });
  // Or from a .json asset that defines sprite locations
  Q.compileSheets("spritesheet.png","sprites.json");
  Q.animations("Player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7], rate: 1/15, flip: false, loop: true },
      walk_left: { frames:  [8,9,10,11,12,13,14,15], rate: 1/15, flip: false, loop: true },
      jump_right: { frames: [16], rate: 1/10, flip: false },
      jump_left: { frames:  [17], rate: 1/10, flip: false },
      fall_right: { frames:  [18], rate: 1/10, flip: false },
      fall_left: { frames:  [19], rate: 1/10, flip: false },
      stand_right: { frames:[3], rate: 1/10, flip: false },
      stand_left: { frames: [11], rate: 1/10, flip: false },
    });

  // Finally, call stageScene to run the game
  Q.stageScene("title",1, { label: "Super Awesome Platformer" }); 
  //Q.audio.play('Rick-astley.mp3',{ loop: true });
});
 
// ## Possible Experimentations:
// 
// The are lots of things to try out here.
// 
// 1. Modify level.json to change the level around and add in some more enemies.
// 2. Add in a second level by creating a level2.json and a level2 scene that gets
//    loaded after level 1 is complete.
// 3. Add in a title screen
// 4. Add in a hud and points for jumping on enemies.
// 5. Add in a `Repeater` behind the TileLayer to create a paralax scrolling effect.

});
