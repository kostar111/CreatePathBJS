var createPath = function (diameterTop, diameterBottom, tessellation, points, scene) {
    var subdivisions = points.length;
    var radiusTop = diameterTop / 2;
    var radiusBottom = diameterBottom / 2;
    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    var height = 1;
    height = height || 1;
    diameterTop = diameterTop || 0.5;
    diameterBottom = diameterBottom || 1;
    tessellation = tessellation || 16;
    subdivisions = subdivisions || 4;
    subdivisions = (subdivisions < 2) ? 2 : subdivisions;

    var getCircleVector = function (i) {
        var angle = (i * 2.0 * Math.PI / tessellation);
        var dx = Math.cos(angle);
        var dz = Math.sin(angle);

        return new BABYLON.Vector3(dx, 0, dz);
    };

    var createCylinderCap = function (isTop) {
        var radius = isTop ? radiusTop : radiusBottom;

        if (radius == 0) {
            return;
        }
        var vbase = positions.length / 3;

        var normal = new BABYLON.Vector3(0, 1, 0);
        var textureScale = new BABYLON.Vector2(0.5, 0.5);

        if (!isTop) {
            normal = normal.scale(-1);
            textureScale.x = -textureScale.x;
        }

        // Positions, normals & uvs
        for (i = 0; i < tessellation; i++) {
            var circleVector = getCircleVector(i);
            var position = circleVector.scale(radius).add(normal.scale(height/2));
            var textureCoordinate = new BABYLON.Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);

            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);
        }

        // Indices
        for (var i = 0; i < tessellation - 2; i++) {
            if (!isTop) {
                indices.push(vbase);
                indices.push(vbase + (i + 2) % tessellation);
                indices.push(vbase + (i + 1) % tessellation);
            } else {
                indices.push(vbase);
                indices.push(vbase + (i + 1) % tessellation);
                indices.push(vbase + (i + 2) % tessellation);
            }
        }
    };

    var base = new BABYLON.Vector3(0, -1, 0).scale(height/2);
    var offset = new BABYLON.Vector3(0, 1, 0).scale(height/(subdivisions-1));

    var stride = tessellation + 1;

    // Positions, normals & uvs
    for (var i = 0; i <= tessellation; i++) {
        var normal = getCircleVector(i);
        var textureCoordinate = new BABYLON.Vector2(i / tessellation, 0);
        var position, radius = radiusBottom;
        
        for (var s = 0; s < subdivisions; s++) {
            if (s == 0) {
                var AC = points[1].subtract(points[0]);
                var angle = Math.PI/2 - Math.cos(new BABYLON.Vector3(points[1].x, 0, points[1].z).length()/AC.length());
                //~ if (i == 0) {
                    displayVector (normal, "red", scene);
                    displayVector (AC, "blue", scene);
                    var axis = BABYLON.Vector3.Cross(AC,new BABYLON.Vector3(points[1].x, 0, points[1].z));
                    displayAxis (points[s], axis, "blue", scene);
                    var transformMatrix = BABYLON.Matrix.RotationAxis(axis, angle);
                    var place = BABYLON.Vector3.TransformNormal(normal, transformMatrix);
                    position = place.scale(radius);
                    position.addInPlace(points[s]);
                    displayVector (place, "green", scene);
                //~ } else {
                    //~ position = normal.scale(radius);
                    //~ position.addInPlace(points[s]);
                //~ }
                //~ var axis = BABYLON.Vector3.Cross(AC, new BABYLON.Vector3(points[1].x, 0, points[1].z));
                //~ console.log(points[1]);
                //~ 
                //~ 
                
            }
            else {
                position = normal.scale(radius);
                position.addInPlace(points[s]);
            }

            
            textureCoordinate.y += 1/(subdivisions -1);
            radius += (radiusTop - radiusBottom)/(subdivisions - 1);

            // Push in arrays
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);
        }
    }

    // Indices 
    for (var s = 0; s < subdivisions-1; s++) {
        for (var i = 0; i <= tessellation; i++) {
            indices.push(i * subdivisions + s);// 0
            indices.push((i * subdivisions + (s + subdivisions)) % (stride * subdivisions)); // 3
            indices.push(i * subdivisions + (s + 1));// 1

            indices.push(i * subdivisions + (s + 1)); // 1
            indices.push((i * subdivisions + (s + subdivisions)) % (stride * subdivisions));// 3
            indices.push((i * subdivisions + (s + subdivisions+1)) % (stride * subdivisions));// 4
        }
    }
    

    // Create flat triangle fan caps to seal the top and bottom.
    //~ createCylinderCap(true);
    //~ createCylinderCap(false);

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    // Result
    var vertexData = new BABYLON.VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
};


function displayVector (vector, color, scene) {
    if (typeof(color) === "string") {
        switch (color) {
            case "red" : color = new BABYLON.Color3(1, 0, 0);
            break;
            case "green" : color = new BABYLON.Color3(0, 1, 0);
            break;
            case "blue" : color = new BABYLON.Color3(0, 0, 1);
        }
    }
    
    var B = vector.add(vector.scale(1/2));
    var A = B.subtract(vector);

    var line = BABYLON.Mesh.CreateLines("line", [A, B], scene);
    line.color = color;
};

function displayAxis (center, direction, color, scene) {
    if (typeof(color) === "string") {
        switch (color) {
            case "red" : color = new BABYLON.Color3(1, 0, 0);
            break;
            case "green" : color = new BABYLON.Color3(0, 1, 0);
            break;
            case "blue" : color = new BABYLON.Color3(0, 0, 1);
        }
    }
    
    var O = center;
    var A = direction.subtract(center);

    var line = BABYLON.Mesh.CreateLines("line", [O, A], scene);
    line.color = color;
};
