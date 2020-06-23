function NexusObject(url, renderer, render, material) {
  var gl = renderer.context;
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(3);

  geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

  if (!material) this.autoMaterial = true;

  THREE.Mesh.call(this, geometry, material);
  this.frustumCulled = false;

  var mesh = this;
  var instance = (this.instance = new Nexus.Instance(gl));
  instance.open(url);
  instance.onLoad = function () {
    var s = 1 / instance.mesh.sphere.radius;
    var pos = instance.mesh.sphere.center;
    mesh.position.set(-pos[0] * s, -pos[1] * s, -pos[2] * s);
    mesh.scale.set(s, s, s);
    if (mesh.autoMaterial)
      mesh.material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    if (this.mesh.vertex.normal) {
      var normals = new Float32Array(3);
      geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
    }
    if (this.mesh.vertex.color) {
      var colors = new Float32Array(4);
      geometry.addAttribute("color", new THREE.BufferAttribute(colors, 4));
      if (mesh.autoMaterial)
        mesh.material = new THREE.MeshLambertMaterial({
          vertexColors: THREE.VertexColors,
        });
    }

    if (this.mesh.vertex.texCoord) {
      var uv = new Float32Array(2);
      geometry.addAttribute("uv", new THREE.BufferAttribute(uv, 2));
      if (mesh.autoMaterial) {
        var texture = new THREE.DataTexture(
          new Uint8Array([1, 1, 1]),
          1,
          1,
          THREE.RGBFormat
        );
        texture.needsUpdate = true;
        mesh.material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          map: texture,
        });
      }
    }

    if (this.mesh.face.index) {
      var indices = new Uint32Array(3);
      geometry.setIndex(new THREE.BufferAttribute(indices, 3));
    }
    render();
  };
  instance.onUpdate = function () {
    render();
  };

  this.onAfterRender = function (
    renderer,
    scene,
    camera,
    geometry,
    material,
    group
  ) {
    if (!instance.isReady) return;
    var s = renderer.getSize();
    instance.updateView(
      [0, 0, s.width, s.height],
      camera.projectionMatrix.elements,
      mesh.modelViewMatrix.elements
    );
    var program = renderer.context.getParameter(gl.CURRENT_PROGRAM);
    instance.attributes["position"] = renderer.context.getAttribLocation(
      program,
      "position"
    );
    instance.attributes["normal"] = renderer.context.getAttribLocation(
      program,
      "normal"
    );
    instance.attributes["color"] = renderer.context.getAttribLocation(
      program,
      "color"
    );
    instance.attributes["uv"] = renderer.context.getAttribLocation(
      program,
      "uv"
    );

    instance.render();
  };
}

NexusObject.prototype = Object.create(THREE.Mesh.prototype);

/*
NexusObject.prototype.raycast = function(raycaster, intersects) {
	var instance = this.instance;
	var nexus = instance.mesh;
	if(!nexus.sphere) return;
	var sp = nexus.sphere;
	var c = sp.center;
	var center = new THREE.Vector3(c[0], c[1], c[2]);
	var sphere = new THREE.Sphere(center, sp.radius);
	sphere.applyMatrix4( this.matrixWorld );

	if ( raycaster.ray.intersectsSphere( sphere ) === false ) return;
	//just check the last level spheres.
	if(!nexus.sink) return;

	var distance = -1.0;
	var point = null;
	var nfaces = nexus.nfaces[0];
	var nvert = nexus.nvertices[0];
	var coords = nexus.coords[0];
	var indices = nexus.indices[0];

// indexed buffer geometry	
	var intersection = null;
	var uv, i;
	var v0 = new THREE.Vector3(0, 0, 0);
	var v1 = new THREE.Vector3(0, 0, 0);
	var v2 = new THREE.Vector3(0, 0, 0);
	var point = new THREE.Vector3(0, 0, 0);
	var intersectionPointWorld = new THREE.Vector3(0, 0, 0);

	for(i = 0; i < nfaces*3; i+= 3) {
		var a = indices[i];
		var b = indices[i+1];
		var c = indices[i+2];
		v0.x = coords[a*3];
		v0.x = coords[a*3];
		v0.x = coords[a*3];

		v1.x = coords[b*3];
		v1.x = coords[b*3];
		v1.x = coords[b*3];

		v2.x = coords[c*3];
		v2.x = coords[c*3];
		v2.x = coords[c*3];

		var intersect = ray.intersectTriangle( v0, v1, v2 false, point);
		if ( intersect === null ) 
			continue;

		intersectionPointWorld.copy( point );
		intersectionPointWorld.applyMatrix4( object.matrixWorld );
		var distance = raycaster.ray.origin.distanceTo( intersectionPointWorld );

		if ( distance < raycaster.near || distance > raycaster.far ) 
			continue;

		return {
			distance: distance,
			point: intersectionPointWorld.clone(),
			object: object
		};

	intersection = checkIntersection( object, raycaster, ray, vA, vB, vC, intersectionPoint );

				if ( intersection ) {

					if ( uv ) {

						uvA.fromBufferAttribute( uv, a );
						uvB.fromBufferAttribute( uv, b );
						uvC.fromBufferAttribute( uv, c );

						intersection.uv = uvIntersection( intersectionPoint,  vA, vB, vC, uvA, uvB, uvC );

					}

					intersection.face = new Face3( a, b, c, Triangle.normal( vA, vB, vC ) );
					intersection.faceIndex = a;

				}


		intersection = checkBufferGeometryIntersection( this, raycaster, ray, position, uv, indices[i], indices[i+1], indices[i+2]);

		if ( intersection ) {

			intersection.faceIndex = Math.floor( i / 3 ); // triangle number in indices buffer semantics
			intersects.push( intersection );

		}

	}


	for(var i = 0; i < nexus.sink; i++) {
		var patch = nexus.nfirstpatch[i];
		if(nexus.patches[patch*3] != nexus.sink)
			continue;
		var x = nexus.nspheres[i*5];
		var y = nexus.nspheres[i*5+1];
		var z = nexus.nspheres[i*5+2];
		var r = nexus.nspheres[i*5+4]; //tight radius
		var sphere = new THREE.Sphere(new THREE.Vector3(x, y, z), r);
		sphere.applyMatrix4( this.matrixWorld );
	
		var p = raycaster.ray.intersectsSphere(sphere);
		if (p != null) {
			var d = sphere.center.lengthSq();
			if(distance == -1.0 || d < distance) {
				distance = d;
				point = p;
			}
		}
	}
	if(distance == -1.0) return; 

	intersects.push({ distance: distance, point: point, object: this} );
}*/
