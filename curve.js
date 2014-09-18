var extraImages = {};
var size = {width: 800, height: 600};
var extraParties = ["self", "others", "all"];
var individualExtras = ["thinner", "thicker", "faster", "slower", "rectangular", "upsideDown", "penetrating", "mine", "beam", "eraser"];
var commonExtras = ["wallbreaking", "deleteAll", "randomExtras", "roleReversal"];

var useKI = false;

$(function () {


    for (var i = 0; i < individualExtras.length; i++) {
        var iImage = new Image();
        iImage.src = individualExtras[i] + ".png";
        iImage.className = "extra_image_display";
        extraImages[ individualExtras[i]] = iImage;

        var indExtNames = individualExtras[i].replace(/\d+/g, '~$&').split(/(?=[A-Z])|~/);
        ;

        var indExtName = "";

        if (indExtNames) {

            $.each(indExtNames, function (index, value) {
                indExtName += " " + value.toLowerCase();
            });
        } else
            indExtName = individualExtras[i];

        $("#legend_container").append("<div class='legend_entry'>" + iImage.outerHTML + indExtName + "</div>");


    }
    for (var j = 0; j < commonExtras.length; j++) {
        var cImage = new Image();
        cImage.src = commonExtras[j] + ".png";
        cImage.className = "extra_image_display";
        extraImages[commonExtras[j]] = cImage;

        var comExtNames = commonExtras[j].replace(/\d+/g, '~$&').split(/(?=[A-Z])|~/);

        var comExtName = "";

        if (comExtNames) {
            $.each(comExtNames, function (index, value) {
                comExtName += " " + value.toLowerCase();
            });
        } else
            comExtName = commonExtras[j];


        $("#legend_container").append("<div class='legend_entry'>" + cImage.outerHTML + comExtName + "</div>");

    }


    $("#help").on("click", function () {
        $("#dialog_mask").show();
    });

    $("#close_dialog").on("click", function () {
        $("#dialog_mask").hide();
    });


    var game = new Game();
    game.initiate();

});


Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

function calculatePosition() {
    return {x: getRandomInt(100, size.width - 100), y: getRandomInt(100, size.height - 100)};
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function jqueryRgbToHex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2);
}

function getPositionRelativeToAngle(x1, y1, length, angle) {

    angle *= Math.PI / 180;

    var x2 = x1 + length * Math.cos(angle),
        y2 = y1 + length * Math.sin(angle);

    return {x: x2, y: y2};
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function Game() {

    this.potentialPlayerNames = ["albert", "guenther", "roswitha", "liselotte", "hartmut", "agathe"];
    this.colors = ["#FF00F1", "#FFC900", "#0014FF", "#555555", "#2EC1FF", "#FFFFFF"];
    this.playerColors = {};


    this.finalPoints = 0;
    this.roundOrder = [];
    this.playersPoints = {};
    this.activePlayer = null;

    this.ctx = null;
    this.keyCounter = 0;
    this.canvas = null;

    this.players = [];
    this.activeExtras = [];

    this.canvas = null;
    this.extraTimeout = null;
    this.extraCtx = null;
    this.borderCtx = null;
    this.headCtx = null;
    this.actionCtx = null;

    this.activeActions = [];


    for (var i = 0; i < this.potentialPlayerNames.length; i++) {
        this.playerColors[this.potentialPlayerNames[i]] = this.colors[i];
    }


    this.setPlayer = function (playerName, leftKey, rightKey, actionKey, ki) {
        this.players.push(new Player(playerName, rightKey, leftKey, actionKey, this.playerColors[playerName], ki));
    };


    this.reset = function () {

        clearInterval(this.activeRound);

        clearTimeout(this.extraTimeout);

        $(document).off("keydown keyup", this.keyListener);
        $(document).off("keydown.space");

        this.finalPoints = 0;
        this.roundOrder = [];
        this.playersPoints = {};
        this.activePlayer = null;

        this.ctx = null;
        this.keyCounter = 0;
        this.canvas = null;

        this.players = [];
        this.activeExtras = [];
        this.activeActions = [];


        this.canvas = null;
        this.extraTimeout = null;
        this.activeRound = null;
        this.extraCtx = null;
        this.borderCtx = null;
        this.headCtx = null;
        this.actionCtx = null;

        $("#canvas_container").remove();
        $("#statistics").empty();

    };

    this.drawBorder = function (alpha, rgb) {

        if (typeof rgb === "undefined")
            rgb = "255,255,0";


        this.borderCtx.clearRect(0, 0, size.width, size.height);

        this.borderCtx.beginPath();
        this.borderCtx.lineWidth = 4;
        this.borderCtx.moveTo(0, 2);
        this.borderCtx.lineTo(size.width - 2, 2);
        this.borderCtx.lineTo(size.width - 2, size.height - 2);
        this.borderCtx.lineTo(2, size.height - 2);
        this.borderCtx.lineTo(2, 2);
        this.borderCtx.strokeStyle = "rgba(" + rgb + "," + alpha + ")";
        this.borderCtx.stroke();
        this.borderCtx.closePath();
    };

    this.generateExtra = function () {


        var party = extraParties[getRandomInt(0, extraParties.length - 1)];


        var extra = {};

        if (party === "all") {
            extra = {item: commonExtras[getRandomInt(0, commonExtras.length - 1)], party: party};

        } else {
            extra = {item: individualExtras[getRandomInt(0, individualExtras.length - 1)], party: party};


        }

        return extra;
    };


    this.calculateWrapAround = function (_x, _y) {

        var w = size.width;
        var h = size.height;


        if (_x <= 0)
            _x = w - 4.1;
        else if (_x >= w)
            _x = 4.1;

        if (_y <= 0)
            _y = h - 4.1;

        else if (_y >= h)
            _y = 4.1;

        return{x: _x, y: _y};

    };


    this.playInitials = function () {
        $("#preparation").hide();

        var game = $("#game");
        game.append(
            "<div id='canvas_container' class='relative'>" +
                "<canvas id='playground' width='" + size.width + "' height='" + size.height + "' class='canvas_layer'>" +
                "</canvas><canvas id='upper_layer' width='" + size.width + "' height='" + size.height + "' class='canvas_layer'></canvas>" +
                "</canvas><canvas  id='extra_layer' width='" + size.width + "' height='" + size.height + "' class='canvas_layer'></canvas>" +
                "</canvas><canvas id='border_layer' width='" + size.width + "' height='" + size.height + "' class='canvas_layer'></canvas>" +
                "</canvas><canvas  id='action_layer' width='" + size.width + "' height='" + size.height + "' class='canvas_layer'></canvas>" +

                "</div>");

        this.finalPoints = (this.players.length - 1) * 10;

        var stats = $("#statistics");
        stats.append("<div id='goal'>GOAL: " + this.finalPoints + "</div>");

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];


            this.playersPoints[player.name] = 0;


            stats.append("<div class='player_statistic' style='background-color: " + player.color + ";' id='player_statistics_" + player.name + "'><span class='inline'>" + player.name + ": </span><span class='inline player_points' id='player_points_" + player.name + "'>0</span><div class='action flexbox players_action' id='players_action_" + player.name + "'></div></div>");

        }

        stats.append("<button class='button game_button' id='back'>choose players</button>");


        $("#back").on("click", function () {
            $("#game").hide();
            instance.reset();
            $("#preparation").show();
        });


        this.canvas = $("#playground");

        this.extraTimeout = null;


        this.ctx = this.canvas[0].getContext('2d');
        this.headCtx = $("#upper_layer")[0].getContext("2d");
        this.extraCtx = $("#extra_layer")[0].getContext("2d");
        this.borderCtx = $("#border_layer")[0].getContext("2d");
        this.actionCtx = $("#action_layer")[0].getContext("2d");


        this.drawBorder(1, "255,0,0");

        var instance = this;

        this.keyListener = function (e) {
            var code = e.keyCode ? e.keyCode : e.which;
            var down = true;

            if (e.type == "keyup") {
                down = false;
            }

            for (var i = 0; i < instance.players.length; i++) {
                var player = instance.players[i];

                if (code == player.leftKey) {
                    player.leftButtonPressed = down;
                } else if (code == player.rightKey) {
                    player.rightButtonPresed = down;
                } else if (code == player.actionKey) {
                    player.actionButtonPressed = down;
                }
            }


        };


        $(document).on("keydown keyup", this.keyListener);
        game.show();


        this.round();


    };

    this.finalize = function () {

        console.log("final");

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            this.playersPoints[player.name] = 0;

            $("#player_points_" + player.name).text(this.playersPoints[ player.name]);

        }
    };


    this.round = function () {

        var instance = this;

        var extraRadius = 15;

        var borderAlpha = 1;
        var borderBlinkingReverse = false;


        var minDropInterval = 4000;   //4000
        var maxDropInterval = 8000;   //8000


        var dropExtra = function () {


            var extra = instance.generateExtra();

            var position = calculatePosition();

            var color;

            if (extra.party === "all")
                color = "blue";
            else if (extra.party === "self")
                color = "green";
            else if (extra.party === "others")
                color = "red";


            extra.color = color;
            var image = extraImages[extra.item];


            instance.extraCtx.globalCompositeOperation = 'source-over';


            instance.extraCtx.beginPath();
            instance.extraCtx.fillStyle = color;
            instance.extraCtx.arc(position.x, position.y, extraRadius, 0, 2 * Math.PI, false);
            instance.extraCtx.fill();
            instance.extraCtx.closePath();

            instance.extraCtx.beginPath();
            instance.extraCtx.drawImage(image, position.x - extraRadius / 2 - 5, position.y - extraRadius / 2 - 5, 25, 25);
            instance.extraCtx.fill();


            if (instance.extraTimeout != null) {
                clearTimeout(instance.extraTimeout);
                instance.extraTimeout = setTimeout(dropExtra, getRandomInt(minDropInterval, maxDropInterval));
            }

            extra.position = position;
            extra.radius = extraRadius;
            instance.activeExtras.push(extra);


        };


        var blinkingBorder = false;

        var delay = 200;

        var paused = false;

        var initial = false;

        $(document).on("keydown.space", function (e) {
            var code = e.keyCode ? e.keyCode : e.which;

            if (code == 32) {
                paused = !paused;

                if (instance.extraTimeout === null || initial) {
                    initial = false;
                    instance.extraTimeout = setTimeout(dropExtra, getRandomInt(maxDropInterval, maxDropInterval));

                } else {
                    clearTimeout(instance.extraTimeout);
                    instance.extraTimeout = null;
                }
            }
        });


        setTimeout(function () {
            paused = true;
            initial = true;
        }, delay);

        instance.activeRound = setInterval(function () {

                var newPositions = {};

                var winner = null;


                if (!paused) {

                    instance.players = shuffle(instance.players);


                    for (var i = 0; i < instance.players.length; i++) {
                        var player = instance.players[i];

                        if (!player.alive)
                            continue;


                        if (player.actionFired) {

                            player.actionFired = false;


                            player.action.fire({player: instance.players[i], pos: getPositionRelativeToAngle(player.position.x, player.position.y, 80, player.angle), ctx: instance.actionCtx});


                            $("#players_action_" + player.name).html("");

                            if (player.action instanceof Mine) {

                                var copiedAction = {};

                                $.extend(copiedAction, player.action);

                                instance.activeActions.push(copiedAction);

                            }
                            player.action = null;


                        }

                        player.step();


                        var oldPos = player.position;
                        var newPos = player.nextPosition;

                        var l = instance.activeActions.length;

                        while (l--) {

                            var action = instance.activeActions[l];
                            var aX = action.x;
                            var aY = action.y;

                            var d = Math.sqrt(Math.pow(aX - newPos.x, 2) + Math.pow(aY - newPos.y, 2));
                            if (d <= action.radius) {


                                instance.actionCtx.globalCompositeOperation = 'destination-out';
                                instance.actionCtx.beginPath();
                                instance.actionCtx.arc(aX, aY, action.radius + 1, 0, Math.PI * 2, true);
                                instance.actionCtx.fill();
                                instance.actionCtx.closePath();
                                instance.activeActions.splice(e, 1);

                                action.effect(player);

                            }
                        }


                        var e = instance.activeExtras.length;
                        while (e--) {
                            var extra = instance.activeExtras[e];
                            var eX = extra.position.x;
                            var eY = extra.position.y;


                            var dist = Math.sqrt(Math.pow(eX - newPos.x, 2) + Math.pow(eY - newPos.y, 2));
                            if (dist <= extraRadius) {


                                instance.extraCtx.globalCompositeOperation = 'destination-out';
                                instance.extraCtx.beginPath();
                                instance.extraCtx.arc(eX, eY, extra.radius + 1, 0, Math.PI * 2, true);
                                instance.extraCtx.fill();
                                instance.extraCtx.closePath();
                                instance.activeExtras.splice(e, 1);

                                for (var ae = 0; ae < instance.activeExtras.length; ae++) {
                                    var collisionExtra = instance.activeExtras[ae];
                                    var cX = collisionExtra.position.x;
                                    var cY = collisionExtra.position.y;
                                    var distance = Math.sqrt((cX - eX) * (cX - eX ) + (cY - eY) * (cY - eY));


                                    if (distance < extraRadius * 2) {
                                        instance.extraCtx.globalCompositeOperation = 'source-over';

                                        instance.extraCtx.beginPath();
                                        instance.extraCtx.fillStyle = collisionExtra.color;
                                        instance.extraCtx.arc(cX, cY, extraRadius, 0, 2 * Math.PI, false);
                                        instance.extraCtx.fill();
                                        instance.extraCtx.closePath();

                                        var image = extraImages[collisionExtra.item];

                                        instance.extraCtx.beginPath();
                                        instance.extraCtx.drawImage(image, cX - extraRadius / 2 - 5, cY - extraRadius / 2 - 5, 25, 25);
                                        instance.extraCtx.fill();
                                        instance.extraCtx.closePath();

                                        image.src = collisionExtra.item + ".png";


                                    }

                                }


                                if (extra.party === "all") {
                                    if (extra.item === "wallbreaking") {
                                        for (var p = 0; p < instance.players.length; p++) {
                                            instance.players[p].triggerWallbreaking();
                                        }

                                    } else if (extra.item === "deleteAll") {
                                        instance.ctx.clearRect(2, 2, size.width - 4, size.height - 4);
                                    } else if (extra.item === "randomExtras") {
                                        var counter = 0;

                                        var randomExtraTimeout;
                                        clearTimeout(instance.extraTimeout);
                                        instance.extraTimeout = null;

                                        var randomExtra =
                                            function () {
                                                if (counter < 3) {
                                                    counter++;
                                                    dropExtra();
                                                    randomExtraTimeout = setTimeout(randomExtra, 1000);

                                                } else {
                                                    clearTimeout(randomExtraTimeout);
                                                    instance.extraTimeout = setTimeout(dropExtra, getRandomInt(minDropInterval, maxDropInterval));
                                                }


                                            };
                                        randomExtraTimeout = setTimeout(randomExtra, 0);


                                    } else if (extra.item === "roleReversal") {
                                        var playersLeft = instance.players.slice(0);

                                        var len = playersLeft.length;
                                        while (len--) {
                                            if (!playersLeft[len].alive) {
                                                playersLeft.splice(len, 1);
                                            }
                                        }

                                        var tmpPlayers = playersLeft.slice(0);

                                        function getRandomIndex(list, notThis) {

                                            var index = getRandomInt(0, list.length - 1);

                                            if (index === notThis)
                                                return getRandomIndex(list, notThis);
                                            return index;
                                        }

                                        var border = 1;

                                        if (playersLeft.length % 2 !== 0)
                                            border = 0;


                                        while (playersLeft.length > border) {

                                            //odd number of players
                                            if (playersLeft.length === 1) {
                                                var ind = 0;
                                                for (var n = 0; n < tmpPlayers.length; n++)
                                                    if (tmpPlayers[n].name === playersLeft[0].name) {
                                                        ind = n;
                                                        break;
                                                    }


                                                playersLeft.push(tmpPlayers[getRandomIndex(tmpPlayers, ind)])
                                            }


                                            var index1 = getRandomIndex(playersLeft);
                                            var index2 = getRandomIndex(playersLeft, index1);

                                            var playerToReverse1 = playersLeft[index1];
                                            var playerToReverse2 = playersLeft[index2];

                                            var tmpPlayer = {};

                                            $.extend(tmpPlayer, playerToReverse1);


                                            function changePlayersProperties(player1, player2, index1, index2) {
                                                instance.players[index1].position = player2.position;
                                                instance.players[index1].nextPosition = player2.nextPosition;
                                                instance.players[index1].angle = player2.angle;

                                                instance.players[index2].position = player1.position;
                                                instance.players[index2].nextPosition = player1.nextPosition;
                                                instance.players[index2].angle = player1.angle;

                                                instance.players[index1].rightButtonPresed = false;
                                                instance.players[index1].leftButtonPressed = false;
                                                instance.players[index2].rightButtonPresed = false;
                                                instance.players[index2].leftButtonPressed = false;

                                            }

                                            var i1 = null;
                                            var i2 = null;
                                            for (var a = 0; a < instance.players.length; a++) {
                                                if (instance.players[a].name === playerToReverse1.name)
                                                    i1 = a;
                                                else if (instance.players[a].name === playerToReverse2.name)
                                                    i2 = a;
                                            }

                                            changePlayersProperties(tmpPlayer, playerToReverse2, i1, i2);

                                            playersLeft.splice(index1, 1);
                                            playersLeft.splice(index2, 1);
                                        }

                                        for (var k = 0; k < instance.players.length; k++) {
                                            if (instance.players[k].name == player.name) {
                                                player = instance.players[k];
                                                oldPos = player.position;
                                                newPos = player.nextPosition;
                                            }
                                        }

                                    }

                                } else {
                                    for (var pl = 0; pl < instance.players.length; pl++) {
                                        if (extra.party === "self" && instance.players[pl].name === player.name) {

                                            if (extra.item === "thinner") {
                                                player.triggerThinner();
                                            } else if (extra.item === "mine") {
                                                player.triggerMine();
                                                $("#players_action_" + player.name).html("<img class='player_action' src='mine.png' />");
                                            } else if (extra.item === "beam") {
                                                player.triggerBeam();
                                                $("#players_action_" + player.name).html("<img class='player_action' src='beam.png' />");
                                            } else if (extra.item === "thicker") {
                                                player.triggerThicker();
                                            } else if (extra.item === "faster") {
                                                player.triggerFaster();
                                            } else if (extra.item === "slower") {
                                                player.triggerSlower();
                                            } else if (extra.item === "rectangular") {
                                                player.triggerRectangular();
                                            } else if (extra.item === "upsideDown") {
                                                player.triggerUpsideDown();
                                            } else if (extra.item === "penetrating") {
                                                player.triggerPenetrating();
                                            } else if (extra.item === "eraser") {
                                                player.triggerEraser();
                                                $("#players_action_" + player.name).html("<img class='player_action' src='eraser.png' />");
                                            }
                                        } else if (extra.party === "others" && instance.players[pl].name !== player.name && instance.players[pl].alive)
                                            if (extra.item === "thinner") {
                                                instance.players[pl].triggerThinner();

                                            } else if (extra.item === "mine") {
                                                instance.players[pl].triggerMine();
                                                $("#players_action_" + instance.players[pl].name).html("<img class='player_action' src='mine.png' />");


                                            } else if (extra.item === "beam") {
                                                instance.players[pl].triggerBeam();
                                                $("#players_action_" + instance.players[pl].name).html("<img class='player_action' src='beam.png' />");


                                            } else if (extra.item === "thicker") {
                                                instance.players[pl].triggerThicker();
                                            } else if (extra.item === "eraser") {
                                                instance.players[pl].triggerEraser();
                                                $("#players_action_" + instance.players[pl].name).html("<img class='player_action' src='eraser.png' />");


                                            } else if (extra.item === "faster") {
                                                instance.players[pl].triggerFaster();
                                            } else if (extra.item === "slower") {
                                                instance.players[pl].triggerSlower();
                                            } else if (extra.item === "rectangular") {
                                                instance.players[pl].triggerRectangular();
                                            } else if (extra.item === "upsideDown") {
                                                instance.players[pl].triggerUpsideDown();
                                            } else if (extra.item === "penetrating") {
                                                instance.players[pl].triggerPenetrating();


                                            }
                                    }
                                }

                            }

                        }

                        blinkingBorder = player.wallbreaking;

                        if (player.wallbreaking && (newPos.x >= size.width - 4 || newPos.y >= size.height - 4 || newPos.x <= 4 || newPos.y <= 4)) {
                            newPos = instance.calculateWrapAround(newPos.x, newPos.y);
                            player.position = newPos;


                            continue;

                        }


                        var collied = null;


                        for (var cp = 0; cp < player.checkingPositions.length; cp++) {
                            var cPos = player.checkingPositions[cp];

                            if (cPos.x >= size.width - 4 || cPos.y >= size.height - 4 || cPos.x <= 4 || cPos.y <= 4) {
                                collied = cPos;
                                break;
                            }

                            var pixelColor = instance.ctx.getImageData(cPos.x, cPos.y, 1, 1).data;
                            var hex = "#" + ("000000" + ((pixelColor[0] << 16) | (pixelColor[1] << 8) | pixelColor[2]).toString(16)).slice(-6);

                            if (hex !== jqueryRgbToHex(instance.canvas.css("background-color"))) {
                                collied = cPos;
                                break;
                            }


                        }

                        if (player.eraser) {

                            var eraserPos = getPositionRelativeToAngle(oldPos.x, oldPos.y, 10, player.angle);
                            instance.ctx.beginPath();
                            instance.ctx.fillStyle = "#000000";
                            instance.ctx.arc(eraserPos.x, eraserPos.y, 10, 0, Math.PI * 2, true);
                            instance.ctx.fill();
                            instance.ctx.closePath();
                        }


                        if (!player.penetrating && collied || player.killed) {

                            if (collied) {
                                instance.ctx.beginPath();
                                instance.ctx.lineWidth = player.weight;
                                instance.ctx.strokeStyle = player.color;
                                instance.ctx.moveTo(oldPos.x, oldPos.y);
                                instance.ctx.lineTo(collied.x, collied.y);
                                instance.ctx.stroke();
                                instance.ctx.closePath();
                            }

                            if (winner === null) {
                                player.alive = false;

                                instance.playersPoints[player.name] += instance.roundOrder.length;
                                instance.roundOrder.push(player);

                                $("#players_action_" + player.name).html("");


                                console.log("DEAD:", player.name);

                                if (instance.roundOrder.length === instance.players.length - 1) {
                                    winner = instance.players.diff(instance.roundOrder)[0].name;
                                    instance.playersPoints[winner] += instance.roundOrder.length;
                                    instance.roundOrder.push(winner);

                                    $("#player_points_" + winner).text(instance.playersPoints[winner]);

                                }

                                $("#player_points_" + player.name).text(instance.playersPoints[player.name]);
                            }

                            continue;

                        }

                        newPositions[player.name] = {pos: newPos, radius: player.weight / 2, color: player.headColor};

                        instance.ctx.beginPath();
                        instance.ctx.lineWidth = player.weight;
                        instance.ctx.strokeStyle = player.color;
                        instance.ctx.moveTo(oldPos.x, oldPos.y);
                        instance.ctx.lineTo(newPos.x, newPos.y);
                        instance.ctx.stroke();
                        instance.ctx.closePath();


                        player.position = newPos;


                    }


                    if (blinkingBorder) {

                        if (borderAlpha > 0 && !borderBlinkingReverse) {
                            borderAlpha -= 0.1;
                        } else if (borderAlpha <= 0) {
                            borderBlinkingReverse = true
                        }
                        if (borderBlinkingReverse) {
                            borderAlpha += 0.1;

                            if (borderAlpha >= 1) {
                                borderBlinkingReverse = false;
                            }
                        }

                        instance.drawBorder(borderAlpha);
                    }
                    else {
                        borderBlinkingReverse = false;
                        borderAlpha = 1;
                        instance.drawBorder(borderAlpha, "255,0,0");
                    }

                    instance.headCtx.clearRect(0, 0, size.width, size.height);
                    for (var pos in newPositions) {

                        instance.headCtx.beginPath();
                        instance.headCtx.fillStyle = newPositions[pos].color;

                        instance.headCtx.arc(newPositions[pos].pos.x, newPositions[pos].pos.y, newPositions[pos].radius, 0, 2 * Math.PI, false);
                        instance.headCtx.fill();
                        instance.headCtx.closePath();

                    }


                    if (winner) {
                        clearInterval(instance.activeRound);

                        clearTimeout(instance.extraTimeout);
                        instance.extraTimeout = null;


                        $(document).off("keydown keyup", instance.keyListener);
                        $(document).off("keydown.space");


                        var finalized = false;
                        for (var pla = 0; pla < instance.players.length; pla++) {

                            var playerI = instance.players[pla];

                            if (instance.finalPoints <= instance.playersPoints[playerI.name]) {
                                finalized = true;

                                var again = confirm(playerI.name + " WINS!\n\nplay again?");

                                if (again) {
                                    var copiedPlayer = instance.players.splice(0);
                                    instance.reset();
                                    instance.players = copiedPlayer;
                                    $.each(instance.players, function (index, value) {
                                        value.reset();
                                    });
                                    instance.playInitials();
                                    return;
                                } else {
                                    $("#back").trigger("click");
                                    return;
                                }
                            }
                        }


                        var newRound = function (e) {

                            var code = e.keyCode ? e.keyCode : e.which;

                            if (code === 32) {

                                for (var pl = 0; pl < instance.players.length; pl++) {

                                    var playerI = instance.players[pl];

                                    if (instance.finalPoints <= instance.playersPoints[playerI.name]) {
                                        instance.finalize();
                                    }
                                }

                                instance.roundReset();
                                instance.round();
                                $(document).off("keydown.space", newRound);

                                $(document).on("keydown keyup", instance.keyListener);
                            }

                        };

                        $(document).on("keydown.space", newRound);
                    }
                }

            }
            ,
            60
        )
        ;
    };

    this.roundReset = function () {
        $(".players_action").html("");
        this.extraTimeout = null;
        this.roundOrder = [];
        this.activePlayer = null;
        this.activeExtras = [];
        this.activeActions = [];
        this.extraCtx.clearRect(0, 0, size.width, size.height);
        this.actionCtx.clearRect(0, 0, size.width, size.height);


        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            player.reset();
            this.ctx.clearRect(2, 2, size.width - 4, size.height - 4);
        }

    };


    this.bindKeyListener = function () {

        this.unbindMaskListener();

        var instance = this;

        var label = $("#" + instance.activePlayer);


        $("#key_label").css({top: label.offset().top + label.height() / 2, left: label.width() + label.offset().left + 20});
        $("#key_label").show();

        $(document).on("keydown", function (e) {


            var code = e.keyCode ? e.keyCode : e.which;

            if (code == 27) {
                instance.unbindKeyListener();
                instance.bindMaskListener();


            } else if (instance.keyCounter == 0) {
                $("#left_key_" + instance.activePlayer).attr("name", code);
                $("#left_key_" + instance.activePlayer).text(String.fromCharCode(code));
                instance.keyCounter++;
            } else if (instance.keyCounter == 1) {
                $("#right_key_" + instance.activePlayer).attr("name", code)
                $("#right_key_" + instance.activePlayer).text(String.fromCharCode(code));
                instance.keyCounter++;

            } else if (instance.keyCounter == 2) {
                $("#action_key_" + instance.activePlayer).attr("name", code)
                $("#action_key_" + instance.activePlayer).text(String.fromCharCode(code));
                instance.unbindKeyListener();
                instance.bindMaskListener();


            }


        });
    };

    this.unbindKeyListener = function () {
        $(document).off("keydown");
        $("#key_label").hide();
        delete this.activePlayer;
        this.keyCounter = 0;

    };
    this.bindMaskListener = function () {
        var masks = $(".mask");
        var instance = this;
        masks.show();
        this.unbindKeyListener();
        masks.on("click", function () {
            var m = $(this);
            instance.activePlayer = m.parent().attr("id");

            $("#left_key_" + instance.activePlayer).attr("name", "");
            $("#left_key_" + instance.activePlayer).text("");
            $("#right_key_" + instance.activePlayer).attr("name", "");
            $("#right_key_" + instance.activePlayer).text("");
            $("#action_key_" + instance.activePlayer).attr("name", "");
            $("#action_key_" + instance.activePlayer).text("");

            m.hide();
            instance.bindKeyListener();
        });
    };

    this.unbindMaskListener = function () {
        var instance = this;
        $(".mask").off("click");
    };


    this.initiate = function () {

        var instance = this;

        for (var i = 0; i < this.potentialPlayerNames.length; i++) {

            var name = this.potentialPlayerNames[i];

            $("#players_container").append("<div  id='" + name + "' class='player relative'>" +
                "<div class='mask'></div>" +
                "<span class='float_left player_label' style='background-color: " + this.playerColors[name] + "'>" + name + "</span>" +
                "<span class='float_left key_input' id='left_key_" + name + "' ></span>" +
                "<span class='float_left key_input' id='right_key_" + name + "'></span>" +
                "<span class='float_left key_input' id='action_key_" + name + "'></span>" +
                "</div>");


        }

        this.bindMaskListener();


        $("#play_button").on("click", function () {


            var counter = 0;
            for (var i = 0; i < instance.potentialPlayerNames.length; i++) {

                name = instance.potentialPlayerNames[i];


                var left = $("#left_key_" + name).attr("name");
                var right = $("#right_key_" + name).attr("name");
                var action = $("#action_key_" + name).attr("name");


                if ((typeof left == "undefined" || left === "") && (typeof right == "undefined" || right === "") && (typeof action == "undefined" || action === "")) {
                    continue;
                } else if (typeof left == "undefined" || left == "") {
                    alert(name + ", please set your left key");
                    return;
                } else if (typeof right == "undefined" || right == "") {
                    alert(name + ", please set your right key");
                    return;
                }
                else if (typeof action == "undefined" || action == "") {
                    alert(name + ", please set your action key");
                    return;
                }
                if (left === right || action === right || action === left) {
                    alert(name + ", you chose the same key for both directions or your action key");
                    return;
                }

                var ki = null;
                if (useKI)
                    ki = new KI(instance);

                instance.setPlayer(name, left, right, action, ki);
                console.log(instance.players);
                counter++;


            }

            if (counter < 2) {
                alert("you have only selected " + counter + " players");
            } else {
                instance.playInitials();
            }


        });

    };
}

function Player(name, rightKey, leftKey, actionKey, color, ki) {

    this.ki = ki;
    this.headColor = "#FFFF00";
    this.penetrating = false;
    this.eraser = false;
    this.wallbreaking = false;
    this.rectangular = false;
    this.upsideDown = false;
    this.minExtraTime = 4000;
    this.maxExtraTime = 6000;
    this.rightKey = rightKey;
    this.leftKey = leftKey;
    this.actionKey = actionKey;
    this.name = name;
    this.angle = getRandomInt(0, 360);
    this.alive = true;
    this.killed = false;
    this.position = calculatePosition();
    this.nextPosition = this.position;
    this.checkingPositions = [this.position];

    this.color = color;
    this.speed = 1.8;
    this.weight = 4;

    this.rightButtonPresed = false;
    this.leftButtonPressed = false;
    this.actionButtonPressed = false;
    this.action = null;

    this.actionFired = false;


    this.slowerTimeout = function () {
    };
    this.eraserTimeout = function () {
    };
    this.fasterTimeout = function () {
    };
    this.wallbreakingTimeout = function () {
    };
    this.penetratingTimeout = function () {
    };
    this.thinnerTimeout = function () {
    };
    this.thickerTimeout = function () {
    };
    this.upsideDownTimeout = function () {
    };
    this.rectangularTimeout = function () {
    };

    if (this.ki) {
        this.ki.initiate(this);
    }

    this.triggerUpsideDown = function () {
        var instance = this;
        this.headColor = "#FF0000";
        this.upsideDown = true;
        instance.upsideDownTimeout = setTimeout(function () {
            instance.upsideDown = false;
            instance.headColor = "#FFFF00";
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
    };

    this.triggerEraser = function () {
        this.action = new Eraser();
    };


    this.triggerWallbreaking = function () {
        var instance = this;
        this.wallbreaking = true;
        instance.wallbreakingTimeout = setTimeout(function () {
            instance.wallbreaking = false;
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
    };


    this.triggerPenetrating = function () {
        this.headColor = "#00FF00";
        var instance = this;
        this.penetrating = true;
        instance.penetratingTimeout = setTimeout(function () {
            instance.penetrating = false;
            instance.headColor = "#FFFF00";
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
    };

    this.triggerRectangular = function () {
        var instance = this;
        this.rectangular = true;
        instance.rectangularTimeout = setTimeout(function () {
            instance.rectangular = false;
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
    };


    this.triggerThicker = function () {
        var instance = this;
        if (this.weight === 1)
            this.weight = 2;
        else
            this.weight += 2;
        instance.thickerTimeout = setTimeout(function () {
            if (instance.weight === 2)
                instance.weight -= 1;
            else
                instance.weight -= 2;
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));

    };

    this.triggerThinner = function () {
        var instance = this;
        if (this.weight >= 2) {
            if (this.weight == 2)
                this.weight = 1;
            else
                this.weight -= 2;
            instance.thinnerTimeout = setTimeout(function () {
                if (instance.weight == 1)
                    instance.weight = 2;
                else
                    instance.weight += 2;
            }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
        }
    };

    this.triggerFaster = function () {
        var instance = this;
        if (this.speed <= 8) {
            this.speed *= 2;
            instance.fasterTimeout = setTimeout(function () {
                instance.speed /= 2;
            }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
        }
    };

    this.triggerSlower = function () {
        var instance = this;
        if (this.speed >= 0.5) {
            this.speed /= 2;
            instance.slowerTimeout = setTimeout(function () {
                instance.speed *= 2;
            }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
        }
    };

    this.triggerMine = function () {
        this.action = new Mine();

    };

    this.triggerBeam = function () {
        this.action = new Beam();

    };

    this.clearTimeouts = function () {
        clearTimeout(this.slowerTimeout);
        clearTimeout(this.fasterTimeout);
        clearTimeout(this.wallbreakingTimeout);
        clearTimeout(this.penetratingTimeout);
        clearTimeout(this.thinnerTimeout);
        clearTimeout(this.thickerTimeout);
        clearTimeout(this.upsideDownTimeout);
        clearTimeout(this.rectangularTimeout);
        clearTimeout(this.eraserTimeout);


    };

    this.startErasing = function () {
        var instance = this;
        this.eraser = true;
        instance.eraserTimeout = setTimeout(function () {
            instance.eraser = false;
        }, getRandomInt(instance.minExtraTime, instance.maxExtraTime));
    };


    this.storedColor = color;

    var instance = this;

    function startGap() {
        instance.color = "#000000";
        setTimeout(stopGap, 250);

    }

    function stopGap() {
        setTimeout(startGap, getRandomInt(3000, 6000));
        instance.color = instance.storedColor;
    }

    setTimeout(startGap, getRandomInt(3000, 6000));


    this.toString = function () {
        return "Player: [weight: " + this.weight + "; speed: " + this.speed + "; alive: " + this.alive + "; ]"
    };

    this.reset = function () {
        this.angle = getRandomInt(0, 360);
        this.alive = true;
        this.position = calculatePosition();
        this.nextPosition = this.position;
        this.checkingPositions = [this.position];
        this.speed = 1.8;
        this.weight = 4;
        this.color = this.storedColor;
        this.headColor = "#FFFF00";
        this.penetrating = false;
        this.wallbreaking = false;
        this.rectangular = false;
        this.upsideDown = false;
        this.rightButtonPresed = false;
        this.leftButtonPressed = false;
        this.actionButtonPressed = false;
        this.action = null;
        this.actionFired = false;
        this.killed = false;
        this.eraser = false;


        this.clearTimeouts();


    };


    this.step = function () {


        var angleOffset = 8;

        var checkingArea = 2;

        if (this.rectangular) {
            angleOffset = 90;
            checkingArea = this.weight;
        }


        if (this.upsideDown)
            angleOffset *= -1;

        if (this.ki) {
            this.ki.step();

        }


        if (this.rightButtonPresed) {
            this.angle += angleOffset;
        }

        if (this.leftButtonPressed)
            this.angle -= angleOffset;
        if (this.rectangular) {
            this.leftButtonPressed = false;
            this.rightButtonPresed = false;
        }


        if (this.actionButtonPressed) {
            if (this.action != null) {
                this.actionFired = true;
            }
        }

        var currentX = this.position.x;
        var currentY = this.position.y;

        this.nextPosition = getPositionRelativeToAngle(currentX, currentY, this.speed * 2, this.angle);

        this.checkingPositions = [];

        var counterForLength = 2;
        var counterForWeight = 1;

        var startingCheckPosition = getPositionRelativeToAngle(currentX, currentY, checkingArea, this.angle);
        var x = startingCheckPosition.x;
        var y = startingCheckPosition.y;

        while (counterForLength < this.speed * 2) {
            while (counterForWeight < this.weight / 2) {
                this.checkingPositions.push({x: x, y: y});
                this.checkingPositions.push(getPositionRelativeToAngle(x, y, counterForWeight, this.angle - 90));
                this.checkingPositions.push(getPositionRelativeToAngle(x, y, counterForWeight, this.angle + 90));
                counterForWeight++
            }

            counterForWeight = 1;

            var nextCheckPosition = getPositionRelativeToAngle(x, y, 1, this.angle);
            x = nextCheckPosition.x;
            y = nextCheckPosition.y;
            counterForLength++;
        }


    };

    Action = function () {


    };
    Action.prototype.fire = function (args) {

    };

    Action.prototype.x = 0;
    Action.prototype.y = 0;
    Action.prototype.radius = 10;
    Action.prototype.color = "#EE1010";

    Mine = function () {

    };
    Mine.prototype = new Action();
    Mine.prototype.name = "mine";
    Mine.prototype.constructor = Mine;
    Mine.prototype.fire = function (args) {


        var x = args.pos.x;
        var y = args.pos.y;
        var ctx = args.ctx;

        this.x = x;
        this.y = y;

        ctx.globalCompositeOperation = 'source-over';

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.fillStyle = "#c9c9c9";
        ctx.arc(x, y, this.radius / 2, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();


        ctx.beginPath();
        ctx.fillStyle = "#000";
        ctx.arc(x, y, this.radius / 4, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();


    };

    Mine.prototype.effect = function (player) {
        player.killed = true;

    };

    Beam = function () {

    };

    Beam.prototype = new Action();
    Beam.prototype.name = "beam";
    Beam.prototype.constructor = Beam;
    Beam.prototype.fire = function (args) {

        args.player.position = calculatePosition();
    };

    Eraser = function () {

    };

    Eraser.prototype = new Action();
    Eraser.prototype.name = "eraser";
    Eraser.prototype.constructor = Eraser;
    Eraser.prototype.fire = function (args) {
        args.player.startErasing();
    };


}
function KI(game, player) {
    this.game = game;
    this.lastDir = null;

    this.initiate = function (player) {
        this.player = player;
    };

    this.step = function () {

        this.player.rightButtonPresed = false;
        this.player.leftButtonPressed = false;

        var radius = 30;
        var offset = this.player.weight;

        var ctx = this.game.ctx;

        var baseAngle = this.player.angle;


        var diagonal = Math.sqrt(Math.pow(radius * 2, 2) + Math.pow(radius * 2, 2));

        var centerPos = getPositionRelativeToAngle(this.player.position.x, this.player.position.y, radius + offset, baseAngle);

        var cornerRectangle = getPositionRelativeToAngle(centerPos.x, centerPos.y, diagonal / 2, baseAngle + getAngle(baseAngle));


        function getAngle(x) {

            return 225 - x;

        }

        //TODO mock
        this.game.extraCtx.clearRect(0, 0, size.width, size.height);
        this.game.extraCtx.beginPath();
        this.game.extraCtx.fillStyle = "red";
        this.game.extraCtx.arc(centerPos.x, centerPos.y, radius, 0, Math.PI * 2, false);
        this.game.extraCtx.fill();
        this.game.extraCtx.closePath();


        var imgData = ctx.getImageData(cornerRectangle.x, cornerRectangle.y, radius * 2, radius * 2);


        var counterRight = 0;
        var counterLeft = 0;

        var shortest = {dir: "right", dist: radius * 2};

        var point = offset;
        var straight = true;

        //TODO: improve detection!

        while (point < radius * 2) {
            var p = getPositionRelativeToAngle(this.player.position.x, this.player.position.y, point, this.player.angle);
            var imDa = ctx.getImageData(p.x, p.y, 1, 1);
            var h = "#" + ("000000" + ((imDa.data[0] << 16) | (imDa.data[ 1] << 8) | imDa.data[2]).toString(16)).slice(-6);

            if (h != "#000000" || p.x <= 5 || p.x >= size.width - 4 || p.y <= 4 || p.y >= size.height - 4) {
                straight = false;
                break;
            }

            point += 4;
        }


        if (!straight) {

            for (var i = 0; i < imgData.data.length; i += 4) {

                var hex = "#" + ("000000" + ((imgData.data[i] << 16) | (imgData.data[i + 1] << 8) | imgData.data[i + 2]).toString(16)).slice(-6);

                var x = cornerRectangle.x + ((i / 4) % (radius * 2));// is width
                var y = cornerRectangle.y + Math.floor((i / 4) / (radius * 2));// is width


                var dist = Math.sqrt(Math.pow(centerPos.x - x, 2) + Math.pow(centerPos.y - y, 2));


                var startPoint = getPositionRelativeToAngle(this.player.position.x, this.player.position.y, offset, baseAngle);
                var endPoint = getPositionRelativeToAngle(startPoint.x, startPoint.y, radius * 2, baseAngle);


                var absoluteDist = Math.sqrt(Math.pow(startPoint.x - x, 2) + Math.pow(startPoint.y - y, 2));


                if (hex != "#000000" && dist <= radius) {
                    if (isLeftFromLine(startPoint, endPoint, {x: x, y: y})) {
                        counterRight += radius * 2 - absoluteDist;


                        if (absoluteDist < shortest.dist) {
                            shortest.dist = absoluteDist;
                            shortest.dir = "right";
                        }
                    }
                    else {

                        counterLeft += radius * 2 - absoluteDist;
                        if (absoluteDist < shortest.dist) {
                            shortest.dist = absoluteDist;
                            shortest.dir = "left";
                        }
                    }
                } else if (x <= 4 || x >= size.width - 4 || y <= 4 || y >= size.height - 4) {

                    if (isLeftFromLine(startPoint, endPoint, {x: x, y: y})) {
                        counterRight += radius * 2 - absoluteDist;
                        if (absoluteDist < shortest.dist) {
                            shortest.dist = absoluteDist;
                            shortest.dir = "right";
                        }
                    }
                    else {
                        counterLeft += radius * 2 - absoluteDist;
                        if (absoluteDist < shortest.dist) {
                            shortest.dist = absoluteDist;
                            shortest.dir = "left";
                        }
                    }
                }
            }
        }

        var right = false;
        var left = false;

//        if (counterLeft < counterRight)
//            right = false;
//        if (counterLeft > counterRight)
//            left = false;

        if (counterLeft > 0)
            left = true;
        if (counterRight > 0)
            right = true;

        this.player.actionFired = false;

        if (left && !right && !straight) {
            this.player.leftButtonPressed = true;
        } else if (right && !left && !straight) {
            this.player.rightButtonPresed = true;


        } else if (left && right && !straight) {

            if (shortest.dir == "left" && counterLeft < counterRight) {
                this.player.leftButtonPressed = true;

            } else if (shortest.dir == "left")
                this.player.rightButtonPresed = true;
            else if (shortest.dir == "right" && counterLeft > counterRight) {
                this.player.rightButtonPressed = true;
            } else
                this.player.leftButtonPressed = true;


        } else {
            var dir = getRandomInt(-1, 1);

            switch (dir) {
                case -1:
                    this.player.leftButtonPressed = true;
                    break;

                case 1:
                    this.player.rightButtonPresed = true;
                    break;

                default:
                    break;
            }

            console.log("nothing")
        }


    }

}


function isLeftFromLine(lineStart, lineEnd, point) {
    return ((lineEnd.x - lineStart.x) * (point.y - lineStart.y) - (lineEnd.y - lineStart.y) * (point.x - lineStart.x)) > 0;

}

function getAngleOfLineBetweenTwoPoints(p1, p2) {
    var xDiff = p2.x - p1.x;
    var yDiff = p2.y - p1.y;

    var radians = Math.atan2(yDiff, xDiff);

    return radians * 180 / Math.PI;
}

