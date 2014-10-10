depth = depth || 30;

var head = new Node(null, x, y, angle);


return recursiveStep(head);


function recursiveStep(node, n) {

    n = n || 0;


    if (n == depth) {
        return head.next;
    }
    else if (!node) {
        return head.next;
    }

    else if (!node.left && !node.right && !node.straight) {
        if (node.root)
            return head.next;

        return recursiveStep(node.prev, n - 1);
    }

    var h = heuristic(node);

    for (var i = 0; i < h.length; i++) {
        dir = h[i];

        if (node[dir]) {
            var further = (eval(dir))(node);

            if (further !== null) {
                var next = getPositionRelativeToAngle(node.x, node.y, range, node.angle + further);
                node.next = new Node(node, next.x, next.y, node.angle + further);
                node[dir] = false;
                node.next.prev = node;

                return  recursiveStep(node.next, n + 1);
            }
        }
    }


    function straight(n) {
        return nextAngle(n.x, n.y, n.angle, 0);
    }

    function right(n) {
        return nextAngle(n.x, n.y, n.angle, 8);
    }

    function left(n) {
        return nextAngle(n.x, n.y, n.angle, -8);
    }

    function nextAngle(x, y, angle, offset) {
        var free = isFree(x, y, range, angle + offset, imgData, playersWidth);
//            var jo=[true,false];
//            var free=jo[getRandomInt(0,1)];
        if (free) {
            return offset;
        }
        return null;
    }

    return  recursiveStep(node.prev, n - 1);


}


//    var counter=0;
//
//    while (allOverCounter < depth&&counter<50000) {
//        counter++;
//        var next;
//
//        console.log(allOverCounter,currentPoint.straight,currentPoint.left,currentPoint.right);
//
//        var free = isFree(currentPoint.x, currentPoint.y, range, currentPoint.angle, imgData, playersWidth);
//
//
//        if (free && currentPoint.straight) {
//            next = getPositionRelativeToAngle(currentPoint.x, currentPoint.y, range, currentPoint.angle);
//            currentPoint.next = new Node(currentPoint, next.x, next.y, currentPoint.angle);
//            currentPoint.straight = false;
//            currentPoint = currentPoint.next;
//
//            allOverCounter++;
//            continue;
//        }
//
//        free = isFree(currentPoint.x, currentPoint.y, range, currentPoint.angle + 8, imgData, playersWidth);
//        if (free && currentPoint.right) {
//
//            next = getPositionRelativeToAngle(currentPoint.x, currentPoint.y, range, currentPoint.angle + 8);
//            currentPoint.next = new Node(currentPoint, next.x, next.y, currentPoint.angle + 8);
//            currentPoint.right = false;
//            currentPoint = currentPoint.next;
//
//            allOverCounter++;
//            continue;
//
//        }
//
//        free = isFree(currentPoint.x, currentPoint.y, range, currentPoint.angle - 8, imgData, playersWidth);
//        if (free && currentPoint.left) {
//
//            next = getPositionRelativeToAngle(currentPoint.x, currentPoint.y, range, currentPoint.angle - 8);
//            currentPoint.next = new Node(currentPoint, next.x, next.y, currentPoint.angle - 8);
//            currentPoint.left = false;
//            allOverCounter++;
//            currentPoint = currentPoint.next;
//            continue;
//
//        }
//        if (currentPoint.root)
//            return null;
//
//        allOverCounter--;
//        currentPoint = currentPoint.prev;
//
//
//    }
//
//
////    var n = head;
//
////    console.log(angle+" :")
////    while (n.next){
////
////        console.log(n.angle)
////        n= n.next;
////    }
//
//    return head.next;

}
