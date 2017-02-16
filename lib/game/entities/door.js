ig.module(
    'game.entities.door'
)
    .requires(
        'impact.entity'
)
    .defines(function () {

        EntityDoor = ig.Entity.extend({
            size: {
                x: 24,
                y: 24
            },

            type: ig.Entity.TYPE.NONE,
            checkAgainst: ig.Entity.TYPE.BOTH, // Check against friendly
            collides: ig.Entity.COLLIDES.NEVER,
            openedStatus: false,
            animSheet: new ig.AnimationSheet('media/doorTileset.png', 24, 24),


            init: function (x, y, settings) {
                this.parent(x, y, settings);
                this.addAnim('idle', 0.1, [0]);
                this.addAnim('open', 0.1, [1]);
            },


            update: function () {
                // Do nothing in this update function; don't even call this.parent().
                // The coin just sits there, isn't affected by gravity and doesn't move.

                // We still have to update the animation, though. This is normally done
                // in the .parent() update:
                if (this.openedStatus) {
                    this.currentAnim = this.anims.open;
                    this.collides = ig.Entity.COLLIDES.NEVER;
                } else {
                    this.currentAnim = this.anims.idle;
                    this.collides = ig.Entity.COLLIDES.NEVER;
                }

                this.check(null);



                this.currentAnim.update();
            },


            check: function (other) {
                // The instanceof should always be true, since the player is
                // the only entity with TYPE.A - and we only check against A.
                if (other instanceof EntityPlayer || other instanceof EntitySkeleton) {
                    if (this.openedStatus === false) {
                        this.openedStatus = true;
                    }

                } else {

                    this.openedStatus = false;
                }
            }
        });

    });