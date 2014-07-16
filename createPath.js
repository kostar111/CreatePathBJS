var createPath = function (points, radius, tessellation, scene) {
    var subdivisions = points.length;
    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    var subdivisions = points.length - 1;
    var frames = frenetFrames( points );
    console.log(frames);
    var tangents = frames.tangents,
    fnormals = frames.normals,
    binormals = frames.binormals;

    var tangent, normal, binormal;
    for (var j = 0; j <= tessellation; j++ ) {
        for (var i in points) {
            normal = fnormals[i];
            binormal = binormals[i];
            var v = j / tessellation * 2 * Math.PI;
            cx = - radius * Math.cos( v );
            cy = radius * Math.sin( v );

            var position = points[i].add((normal.scale(cx)).add(binormal.scale(cy)));
            var sphere = new BABYLON.Mesh.CreateSphere("name", 10, 0.1, scene);
            positions.push(
                position.x,
                position.y,
                position.z
            );
            
            var newNormal = (normal.scale(cx)).add(binormal.scale(cy));
            displayAxis(position, newNormal, "blue", scene);
            console.log(normal);
            normals.push(
                normal.x,
                normal.y,
                normal.z
            )
        }
    }

    var stride = tessellation + 1;
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

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    // Result
    var vertexData = new BABYLON.VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    console.log(normals);
    vertexData.uvs = uvs;

    return vertexData;
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
    var A = center.add(direction);

    var line = BABYLON.Mesh.CreateLines("line", [O, A], scene);
    line.color = color;
};

function frenetFrames (points) {

    var	tangent = new BABYLON.Vector3(),
        normal = new BABYLON.Vector3(),
        binormal = new BABYLON.Vector3();
    var frames = {},
    tangents = frames.tangents = [];
    normals = frames.normals = [];
    binormals = frames.binormals = [];

    var vec = new BABYLON.Vector3(),
    mat = new BABYLON.Matrix(),

    theta,
    epsilon = 0.0001,
    smallest,

    tx, ty, tz,
    i, u, v;

    // compute the tangent vectors for each segment on the path
    for ( i = 0; i < points.length; i ++ ) {
        tangents[i] = getTangent(points, i);
        BABYLON.Vector3.Normalize(tangents[i]);
    }

    function getTangent (points, it) {
        var tangent;
        if (it == 0) {
            tangent = points[it+1].subtract(points[it]);
        }
        else if (it == points.length - 1) {
            tangent = points[it].subtract(points[it-1]);
        }
        else {
            tangent = points[it+1].subtract(points[it-1]);
        }
        return BABYLON.Vector3.Normalize(tangent);
    };
    initialNormal3();


    function initialNormal3() {
        // select an initial normal vector perpenicular to the first tangent vector,
        // and in the direction of the smallest tangent xyz component

        normals[ 0 ] = new BABYLON.Vector3();
        binormals[ 0 ] = new BABYLON.Vector3();
        smallest = Number.MAX_VALUE;
        tx = Math.abs( tangents[ 0 ].x );
        ty = Math.abs( tangents[ 0 ].y );
        tz = Math.abs( tangents[ 0 ].z );

        if ( tx <= smallest ) {
            smallest = tx;
            normal = new BABYLON.Vector3( 1, 0, 0 );
        }

        if ( ty <= smallest ) {
            smallest = ty;
            normal = new BABYLON.Vector3( 0, 1, 0 );
        }

        if ( tz <= smallest ) {
            normal = new BABYLON.Vector3( 0, 0, 1 );
        }

        vec = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross( tangents[0], normal ));

        normals[ 0 ] = BABYLON.Vector3.Cross( tangents[ 0 ], vec );
        binormals[ 0 ] = BABYLON.Vector3.Cross( tangents[ 0 ], normals[ 0 ] );
    }


    // compute the slowly-varying normal and binormal vectors for each segment on the path
    for ( i = 1; i < points.length; i ++ ) {

        normals[ i ] = normals[ i-1 ].clone();
        binormals[ i ] = binormals[ i-1 ].clone();
        vec = BABYLON.Vector3.Cross( tangents[ i-1 ], tangents[ i ] );

        if ( vec.length() > epsilon ) {

            BABYLON.Vector3.Normalize(vec);
            console.log(tangents[i],tangents[i-1]);
            theta = Math.acos(BABYLON.Vector3.Dot(tangents[i-1], tangents[i]));

            var rotationMatrix = BABYLON.Matrix.RotationAxis(vec, theta);
            BABYLON.Vector3.TransformNormalToRef(normals[i], rotationMatrix, normals[i]);

        }

        binormals[ i ] = BABYLON.Vector3.Cross( tangents[ i ], normals[ i ] );

    }
    console.log(frames);
    return frames;
};
