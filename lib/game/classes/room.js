ig.module('game.classes.room')
    .defines(function () {

        Room = ig.Class.extend({
            enemyCount: 0,
            objectCount: 0,
            northExit: null,
            westExit: null,
            southExit: null,
            eastExit: null,
            northRoom: null,
            westRoom: null,
            southRoom: null,
            eastRoom: null,
            tileArray: null,
            exitCount: 0,
            wallTiles: [],
            groundTiles: [],
            height: 0,
            width: 0,
            init: function (tileArray) {
                this.tileArray = tileArray;
            },

            getEnemyCount: function () {
                return this.enemyCount;
            },
            getTileArray: function () {
                return this.tileArray;
            },
            getNorthExit: function () {
                return this.northExit;
            },
            getWestExit: function () {
                return this.westExit;
            },
            getSouthExit: function () {
                return this.southExit;
            },
            getEastExit: function () {
                return this.eastExit;
            },
            getNorthRoom: function () {
                return this.northRoom;
            },
            getWestRoom: function () {
                return this.westRoom;
            },
            getSouthRoom: function () {
                return this.southRoom;
            },
            getEastRoom: function () {
                return this.eastRoom;
            },
            getExitCount: function () {
                this.exitCount = 0;
                if (this.westExit !== null) {
                    this.exitCount = this.exitCount + 1;
                }
                if (this.nortExit !== null) {
                    this.exitCount = this.exitCount + 1;
                }
                if (this.eastExit !== null) {
                    this.exitCount = this.exitCount + 1;
                }
                if (this.southExit !== null) {
                    this.exitCount = this.exitCount + 1;
                }
                return this.exitCount;

            },
            getOpenExits: function () {
                var openExits = 0;
                if (this.westExit !== null && this.westRoom === null) {
                    openExits = openExits + 1;
                }
                if (this.nortExit !== null && this.northRoom === null) {
                    openExits = openExits + 1;
                }
                if (this.eastExit !== null && this.eastRoom === null) {
                    openExits = openExits + 1;
                }
                if (this.southExit !== null && this.southRoom === null) {
                   openExits = openExits + 1;
                }

                return openExits;
            }



        });
    });