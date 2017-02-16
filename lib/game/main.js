ig.module(
    'game.main'
)
    .requires(
        'plugins.camera',
        'plugins.parallel',
        'game.entities.player',
        'game.entities.door',
        'game.entities.skeleton',
        'impact.game',
        'impact.font',
        'game.levels.demo',
        'game.classes.room',
        'game.constants.level-assets',
        'impact.debug.debug',
        'plugins.fog'

)
    .defines(function () {

        MyGame = ig.Game.extend({

            // Load a font
            font: new ig.Font('media/04b03.font.png'),

            levelAssets: new LevelAssets(),

            turnScheduler: new ROT.Scheduler.Simple(),
            actorCount: 0,
            currentTurn: null,

            init: function () {

                this.turnScheduler.add(this.actorCount += 1, true); /* true = recurring actor */


                this.currentTurn = this.turnScheduler.next();

                /* simulate several turns */
                // Bind keys.
                ig.input.bind(ig.KEY.UP_ARROW, 'up');
                ig.input.bind(ig.KEY.DOWN_ARROW, 'down');
                ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
                ig.input.bind(ig.KEY.W, 'up');
                ig.input.bind(ig.KEY.S, 'down');
                ig.input.bind(ig.KEY.A, 'left');
                ig.input.bind(ig.KEY.D, 'right');



                // Load demo level.

                //this.fog = new ig.Fog(2, 2, 24);

                var dungeon = this.generateDungeon2();
                this.loadLevel(dungeon);
            },

            entitySet: [{
                "type": "EntityPlayer",
                "x": 2232,
                "y": 2232
  }],

            draw: function () {

                this.parent();

                // Give instructions.
                var x = ig.system.width / 2;
                var y = ig.system.height - this.font.height - 2;
                this.font.draw('Use the ARROW KEYS to move around.', x, y, ig.Font.ALIGN.CENTER);

                //   this.fog.draw(this.viewedTile.bind(this));
            },

            viewedTile: function (x, y) {

                var currentX = ig.game.player.getCurrentTile().x;
                var currentY = ig.game.player.getCurrentTile().y;

                if (Math.abs(x - currentX) === 5) {
                    return true;
                }

                if (Math.abs(y - currentY) === 5) {
                    return true;
                }


            },

            loadLevel: function (data) {
                // Remember the currently loaded level, so we can reload when
                // the player dies.
                this.currentLevel = data;

                // Call the parent implemenation; this creates the background
                // maps and entities.
                this.parent(data);

                this.setupCamera();
            },

            setupCamera: function () {
                // Set up the camera. The camera's center is at a third of the screen
                // size, i.e. somewhat shift left and up. Damping is set to 3px.		
                this.camera = new ig.Camera(ig.system.width / 3, ig.system.height / 3, 3);

                // The camera's trap (the deadzone in which the player can move with the
                // camera staying fixed) is set to according to the screen size as well.
                this.camera.trap.size.x = ig.system.width / 3;
                this.camera.trap.size.y = ig.system.height / 3;

                // The lookahead always shifts the camera in walking position; you can 
                // set it to 0 to disable.
                this.camera.lookAhead.x = ig.system.width / 6;

                // Set camera's screen bounds and reposition the trap on the player
                this.camera.max.x = this.collisionMap.pxWidth - ig.system.width;
                this.camera.max.y = this.collisionMap.pxHeight - ig.system.height;
                this.camera.set(this.player);
            },

            update: function () {
                // Update all entities and BackgroundMaps
                this.parent();

                this.camera.follow(this.player);


                //                 Instead of using the camera plugin, we could also just center
                //                 the screen on the player directly, like this:
                                this.screen.x = this.player.pos.x - ig.system.width / 2;
                                this.screen.y = this.player.pos.y - ig.system.height / 2;

            },


            generateRecursive: function (currentRoom, cursorX, cursorY, count) {
                console.log(count);
                console.log(' x: ' + cursorX + ' y: ' + cursorY);
                var blankDungeon = this.levelAssets.blankDungeon;
                if (count > 0 && cursorX - 7 > 0 && cursorY - 7 > 0 && cursorX + 7 < blankDungeon.length && cursorY + 7 < blankDungeon.length) {
                    count = count - 1;

                    var currentRoomTileArray = currentRoom.getTileArray();

                    for (var i = 0; i < currentRoomTileArray.length; i++) {
                        for (var j = 0; j < currentRoomTileArray[i].length; j++) {
                            if (currentRoomTileArray[i][j] !== 664 && currentRoomTileArray[i][j] !== 665 && currentRoomTileArray[i][j] !== 666 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 664 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 665 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 666) {
                                this.levelAssets.blankCollision[cursorY + i][cursorX + j] = 1;
                            } else {
                                this.levelAssets.blankCollision[cursorY + i][cursorX + j] = 0;
                            }

                            if (currentRoomTileArray[i][j] !== 0 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 664 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 665 && this.levelAssets.blankDungeon[cursorY + i][cursorX + j] !== 666) {
                                this.levelAssets.blankDungeon[cursorY + i][cursorX + j] = currentRoomTileArray[i][j];
                            }

                        }
                    }

                    if (currentRoom.westExit !== null && currentRoom.westRoom === null) {

                        var cursor = {
                            x: cursorX,
                            y: cursorY
                        };
                        cursor.x += currentRoom.westExit.x;
                        cursor.y += currentRoom.westExit.y;
                        this.entitySet.push({
                            "type": "EntityDoor",
                            "x": cursor.x * 24,
                            "y": cursor.y * 24
                        });

                        cursor.x -= Math.floor(currentRoom.width / 2);
                        if (this.levelAssets.blankDungeon[cursor.y][cursor.x] === 0) {

                            var room = null;
                            var matchedEntrance = null;
                            cursor = {
                                x: cursorX,
                                y: cursorY
                            };

                            while (matchedEntrance === null) {
                                room = this.levelAssets.getRandomRoom();
                                matchedEntrance = room.getEastExit();
                            }
                            cursor.x = cursor.x - room.width + 1;
                            this.generateRecursive(room, cursor.x, cursor.y, count);
                        }


                    }

                    if (currentRoom.northExit !== null && currentRoom.northRoom === null) {

                        var cursor = {
                            x: cursorX,
                            y: cursorY
                        };
                        cursor.x += currentRoom.northExit.x;
                        cursor.y += currentRoom.northExit.y;
                        this.entitySet.push({
                            "type": "EntityDoor",
                            "x": cursor.x * 24,
                            "y": cursor.y * 24
                        });
                        cursor.y -= Math.floor(currentRoom.height / 2);
                        if (this.levelAssets.blankDungeon[cursor.y][cursor.x] === 0) {

                            this.turnScheduler.add(this.actorCount += 1, true);

                            this.entitySet.push({
                                "type": "EntitySkeleton",
                                "x": cursor.x * 24,
                                "y": cursor.y * 24,
                                settings : { turnNumber : this.actorCount}
                            });


                            var room = null;
                            var matchedEntrance = null;
                            cursor = {
                                x: cursorX,
                                y: cursorY
                            };

                            while (matchedEntrance === null) {
                                room = this.levelAssets.getRandomRoom();
                                matchedEntrance = room.getSouthExit();
                            }
                            cursor.y = cursor.y - room.height + 1;
                            this.generateRecursive(room, cursor.x, cursor.y, count);
                        }


                    }

                    if (currentRoom.eastExit !== null && currentRoom.eastRoom === null) {

                        var cursor = {
                            x: cursorX,
                            y: cursorY
                        };
                        cursor.x += currentRoom.eastExit.x;
                        cursor.y += currentRoom.eastExit.y;
                        this.entitySet.push({
                            "type": "EntityDoor",
                            "x": cursor.x * 24,
                            "y": cursor.y * 24
                        });
                        cursor.x += Math.floor(currentRoom.width / 2);
                        if (this.levelAssets.blankDungeon[cursor.y][cursor.x] === 0) {

                            var room = null;
                            var matchedEntrance = null;
                            cursor = {
                                x: cursorX,
                                y: cursorY
                            };

                            while (matchedEntrance === null) {
                                room = this.levelAssets.getRandomRoom();
                                matchedEntrance = room.getWestExit();
                            }

                            console.log('entrance' + matchedEntrance);
                            cursor.x = cursor.x + room.width - 1;
                            this.generateRecursive(room, cursor.x, cursor.y, count);
                        }


                    }

                    if (currentRoom.southExit !== null && currentRoom.southRoom === null) {

                        var cursor = {
                            x: cursorX,
                            y: cursorY
                        };
                        cursor.x += currentRoom.southExit.x;
                        cursor.y += currentRoom.southExit.y;
                        this.entitySet.push({
                            "type": "EntityDoor",
                            "x": cursor.x * 24,
                            "y": cursor.y * 24
                        });
                        cursor.y += Math.floor(currentRoom.height / 2);
                        if (this.levelAssets.blankDungeon[cursor.y][cursor.x] === 0) {

                            var room = null;
                            var matchedEntrance = null;
                            cursor = {
                                x: cursorX,
                                y: cursorY
                            };

                            while (matchedEntrance === null) {
                                room = this.levelAssets.getRandomRoom();
                                matchedEntrance = room.getNorthExit();
                            }
                            cursor.y = cursor.y + room.height - 1;
                            this.generateRecursive(room, cursor.x, cursor.y, count);
                        }


                    }


                }

            },





            generateDungeon2: function () {

                var cursor = {
                    x: 90,
                    y: 90
                }
                var room = this.levelAssets.getRandomRoom();

                this.generateRecursive(room, cursor.x, cursor.y, 99);




                return {

                    "entities": this.entitySet,


                    "layer": [
                        {
                            "name": "ground",
                            "width": 120,
                            "height": 120,
                            "linkWithCollision": false,
                            "visible": 1,
                            "tilesetName": "media/canvas2_oryx_16bit_fantasy_world.png",
                            "repeat": false,
                            "preRender": false,
                            "distance": "1",
                            "tilesize": 24,
                            "foreground": false,
                            "data": this.levelAssets.blankDungeon
  },
                        {
                            "name": "collision",
                            "width": 120,
                            "height": 120,
                            "linkWithCollision": false,
                            "visible": 0,
                            "tilesetName": "",
                            "repeat": false,
                            "preRender": false,
                            "distance": 1,
                            "tilesize": 24,
                            "foreground": false,
                            "data": this.levelAssets.blankCollision
  }
 ]
                };



            }

        });

         ig.main('#canvas', MyGame, 60, 290, 240, 3.5);
       // ig.main('#canvas', MyGame, 60, 1200, 1200, 3);

    });