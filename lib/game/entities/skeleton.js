ig.module(
    'game.entities.skeleton'
)
    .requires(
        'impact.entity'
)
    .defines(function () {

        EntitySkeleton = ig.Entity.extend({
            size: {
                x: 24,
                y: 24
            },

            type: ig.Entity.TYPE.B, // Evil enemy group
            checkAgainst: ig.Entity.TYPE.A, // Check against friendly
            collides: ig.Entity.COLLIDES.PASSIVE,

            health: 1,
            speed: 100,
            flip: false,

            moveIntention: null,
            lastMove: null,
            destination: null,
            turnNumber : null,

            animSheet: new ig.AnimationSheet('media/skeleTileset.png', 24, 24),


            init: function (x, y, settings) {
                this.parent(x, y, settings);
               this.turnNumber= settings.turnNumber;

                this.addAnim('idle', .5, [0, 1]);
                this.addAnim('dead', 1, [2]);
                this.maxVel.x = this.maxVel.y = this.speed;
            },

            update: function () {
                this.parent();
                if (ig.game.currentTurn === this.turnNumber) {

                    var targetX = Math.floor(ig.game.player.pos.x / 24);
                    var targetY = Math.floor(ig.game.player.pos.y / 24);
                    var currentX = Math.floor(this.pos.x / 24);
                    var currentY = Math.floor(this.pos.y / 24);
                    var distance = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));

                    if (distance < 6) {


                        // It's important that this call occur before the movement code below,
                        // because otherwise you would sometimes see the entity move past his
                        // destination slightly just before snapping back into place.

                        this.moveIntention = null;
                        if (!this.isMoving() && this.moveIntention === null) {
                            var skeleton = this;


                            var passableCallback = function (x, y) {
                                if (ig.game.collisionMap.data !== undefined) {
                                    return ig.game.collisionMap.data[Math.floor(y / 24)][Math.floor(x / 24)] === 0
                                }
                            }

                            var astar = new ROT.Path.AStar(ig.game.player.pos.x, ig.game.player.pos.y, passableCallback, {
                                topology: 4
                            });

                            var path = [];

                            var pathCallback = function (x, y) {

                                path.push([Math.floor(y / 24), Math.floor(x / 24)]);
                            };

                            astar.compute(this.pos.x, this.pos.y, pathCallback);

                            path.shift();
                            if (path.length > 0) {
                                var newX = ig.game.player.pos.x;
                                var newY = ig.game.player.pos.y;
                                if (this.pos.y - newY > 0 && ig.game.collisionMap.data[Math.floor((this.pos.y - 24) / 24)][Math.floor(this.pos.x / 24)] === 0) {
                                    this.moveIntention = moveType.UP;
                                } else if (this.pos.y - newY < 0 && ig.game.collisionMap.data[Math.floor((this.pos.y + 24) / 24)][Math.floor(this.pos.x / 24)] === 0) {
                                    this.moveIntention = moveType.DOWN;
                                } else if (this.pos.x - newX < 0 && ig.game.collisionMap.data[Math.floor(this.pos.y / 24)][Math.floor((this.pos.x + 24) / 24)] === 0) {
                                    this.moveIntention = moveType.RIGHT;
                                } else if (this.pos.x - newX > 0 && ig.game.collisionMap.data[Math.floor(this.pos.y / 24)][Math.floor((this.pos.x - 24) / 24)] === 0) {
                                    this.moveIntention = moveType.LEFT;
                                }

                            }
                        }


                        // Set movement intention based on input.

                        // Stop the moving entity if at the destination.
                        if (this.isMoving() && this.justReachedDestination() && !this.moveIntention) {
                            this.stopMoving();
                            this.currentAnim = this.anims.idle;

                            ig.game.currentTurn = ig.game.turnScheduler.next();
                        }
                        // Stop the moving entity when it hits a wall.
                        else if (this.isMoving() && this.justReachedDestination() && this.moveIntention &&
                            !this.canMoveDirectionFromTile(this.destination.x, this.destination.y, this.moveIntention)) {
                            this.stopMoving();
                            this.currentAnim = this.anims.idle;

                            ig.game.currentTurn = ig.game.turnScheduler.next();
                        }
                        // Destination reached, but set new destination and keep going.
                        else if (this.isMoving() && this.justReachedDestination() && this.moveIntention &&
                            this.canMoveDirectionFromTile(this.destination.x, this.destination.y, this.moveIntention) &&
                            this.moveIntention === this.lastMove) {
                            this.continueMovingFromDestination();
                        }
                        // Destination reached, but changing direction and continuing.
                        else if (this.isMoving() && this.justReachedDestination() && this.moveIntention &&
                            this.canMoveDirectionFromTile(this.destination.x, this.destination.y, this.moveIntention) &&
                            this.moveIntention !== this.lastMove) {
                            this.changeDirectionAndContinueMoving(this.moveIntention);
                        }
                        // Destination not yet reached, so keep going.
                        else if (this.isMoving() && !this.justReachedDestination()) {
                            this.continueMovingToDestination();

                        }
                        // Not moving, but wanting to, so start!
                        else if (!this.isMoving() && this.moveIntention &&
                            this.canMoveDirectionFromCurrentTile(this.moveIntention)) {
                            this.startMoving(this.moveIntention);

                        }

                    } else {
                        ig.game.currentTurn = ig.game.turnScheduler.next();
                    }
                }
            },


            getCurrentTile: function () {
                var tilesize = ig.game.collisionMap.tilesize;
                var tileX = this.pos.x / tilesize;
                var tileY = this.pos.y / tilesize;
                return {
                    x: tileX,
                    y: tileY
                };
            },

            getTileAdjacentToTile: function (tileX, tileY, direction) {
                if (direction === moveType.UP) tileY += -1;
                else if (direction === moveType.DOWN) tileY += 1;
                else if (direction === moveType.LEFT) {
                    tileX += -1;
                    this.currentAnim.flip.x = false;

                } else if (direction === moveType.RIGHT) {
                    tileX += 1;
                    this.currentAnim.flip.x = true;
                }
                return {
                    x: tileX,
                    y: tileY
                };
            },

            startMoving: function (direction) {
                // Get current tile position.
                var currTile = this.getCurrentTile();
                // Get new destination.
                this.destination = this.getTileAdjacentToTile(currTile.x, currTile.y, direction);
                // Move.
                this.setVelocityByTile(this.destination.x, this.destination.y, this.speed);
                // Remember this move for later.
                this.lastMove = direction;
            },

            continueMovingToDestination: function () {
                // Move.
                this.setVelocityByTile(this.destination.x, this.destination.y, this.speed);
            },

            continueMovingFromDestination: function () {
                // Get new destination.
                this.destination = this.getTileAdjacentToTile(this.destination.x, this.destination.y, this.lastMove);
                // Move.
                this.setVelocityByTile(this.destination.x, this.destination.y, this.speed);
            },

            changeDirectionAndContinueMoving: function (newDirection) {
                // Method only called when at destination, so snap to it now.
                this.snapToTile(this.destination.x, this.destination.y);
                // Get new destination.
                this.destination = this.getTileAdjacentToTile(this.destination.x, this.destination.y, newDirection);
                // Move.
                this.setVelocityByTile(this.destination.x, this.destination.y, this.speed);
                // Remember this move for later.
                this.lastMove = newDirection;
            },

            stopMoving: function () {
                // Method only called when at destination, so snap to it now.
                this.snapToTile(this.destination.x, this.destination.y);
                // We are already at the destination.
                this.destination = null;
                // Stop.
                this.vel.x = this.vel.y = 0;
            },

            snapToTile: function (x, y) {
                var tilesize = ig.game.collisionMap.tilesize;
                this.pos.x = x * tilesize;
                this.pos.y = y * tilesize;
            },

            justReachedDestination: function () {
                var tilesize = ig.game.collisionMap.tilesize;
                var destinationX = this.destination.x * tilesize;
                var destinationY = this.destination.y * tilesize;
                var result = (
                    (this.pos.x >= destinationX && this.last.x < destinationX) ||
                    (this.pos.x <= destinationX && this.last.x > destinationX) ||
                    (this.pos.y >= destinationY && this.last.y < destinationY) ||
                    (this.pos.y <= destinationY && this.last.y > destinationY)
                );
                return result;
            },

            isMoving: function () {
                return this.destination !== null;
            },

            canMoveDirectionFromTile: function (tileX, tileY, direction) {
                var newPos = this.getTileAdjacentToTile(tileX, tileY, direction);
                return ig.game.collisionMap.data[newPos.y][newPos.x] === 0;
            },

            canMoveDirectionFromCurrentTile: function (direction) {
                var currTile = this.getCurrentTile();
                return this.canMoveDirectionFromTile(currTile.x, currTile.y, direction);
            },

            // Sets the velocity of the entity so that it will move toward the tile.
            setVelocityByTile: function (tileX, tileY, velocity) {
                var tilesize = ig.game.collisionMap.tilesize;
                var tileCenterX = tileX * tilesize + tilesize / 2;
                var tileCenterY = tileY * tilesize + tilesize / 2;
                var entityCenterX = this.pos.x + this.size.x / 2;
                var entityCenterY = this.pos.y + this.size.y / 2;
                this.vel.x = this.vel.y = 0;
                if (entityCenterX > tileCenterX) this.vel.x = -velocity;
                else if (entityCenterX < tileCenterX) this.vel.x = velocity;
                else if (entityCenterY > tileCenterY) this.vel.y = -velocity;
                else if (entityCenterY < tileCenterY) this.vel.y = velocity;
            },

            kill: function () {
                this.sfxDie.play();
                this.parent();

            },

            handleMovementTrace: function (res) {
                this.parent(res);

                // Collision with a wall? return!
                if (res.collision.x) {
                    this.flip = !this.flip;
                    this.offset.x = this.flip ? 0 : 24;
                }
            },

            check: function (other) {
                other.receiveDamage(1, this);
            }


        });

        var moveType = {
            'UP': 1,
            'DOWN': 2,
            'LEFT': 4,
            'RIGHT': 8
        };

    });