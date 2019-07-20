let renderH, pointLight;

function initScene() {
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  let [width, height, lvls] = [20, 20, 1];
  let maze = MazeCreator.wilsonMaze(width, height, lvls);
  console.log(MazeCreator.mazeToString(maze));
  const floorColor = 0xff7700;
  const wallColor = 0x24478f;
  const [centerX, centerY] = [width + 0.5, height + 0.5];
  for (let z = 0; z < lvls; z++) {
    let levelGeometry = new THREE.CubeGeometry(2 * width + 1, 0.1, 2 * height + 1);
    let levelMaterial = new THREE.MeshPhongMaterial({color: floorColor});
    let levelFloor = new THREE.Mesh(levelGeometry, levelMaterial);
    levelFloor.position.set(0, -lvls + z, 0);
    levelFloor.receiveShadow = true;
    scene.add( levelFloor );
    for (let y = height; y >= 0; y--) {
      if (y < height) {
        for (let x = 0; x < 2 * width + 1; x++) {
          if (x % 2 == 1) { // level cell
            const x2 = (x - 1) / 2;
            let up = false; let down = false;
            if (z > 0) {
              const [bz, by, bx] = MazeCreator.getWallBetween(x2, y, z, x2, y, z - 1);
              if (maze[bz][by][bx] == 0) down = true;
            }
            if (z < lvls - 1) {
              const [bz, by, bx] = MazeCreator.getWallBetween(x2, y, z, x2, y, z + 1);
              if (maze[bz][by][bx] == 0) up = true;
            }
            // if (up && down) ret += 'X';
            // else if (up) ret += '/';
            // else if (down) ret += '\\';
            // else ret += ' ';
          } else { // possibly level wall
            const x2 = x / 2;
            let putwall = false;
            if (x2 > 0 && x2 < width) {
              const [bz, by, bx] = MazeCreator.getWallBetween(x2, y, z, x2 - 1, y, z);
              if (maze[bz][by][bx] == 1) putwall = true;
            } else
              putwall = true;
            if (putwall) {
              let wallGeometry = new THREE.CubeGeometry(1, 1, 1);
              let wallMaterial = new THREE.MeshPhongMaterial({color: wallColor});
              let wall = new THREE.Mesh(wallGeometry, wallMaterial);
              wall.position.set(2 * width + 1 - x - 0.5 - centerX, -lvls + z + 0.5, 2 * y + 1.5 - centerY);
              wall.castShadow = true;
              scene.add( wall );
            }
          }
        }
      }
      for (let x = 0; x < 2 * width + 1; x++) {
        let putwall = false;
        if (y < height && y > 0 && x % 2 == 1) {
          const x2 = (x - 1) / 2;
          const [bz, by, bx] = MazeCreator.getWallBetween(x2, y - 1, z, x2, y, z);
          if (maze[bz][by][bx] == 1) putwall = true;
        } else
          putwall = true;
        if (putwall) {
          let wallGeometry = new THREE.CubeGeometry(1, 1, 1);
          let wallMaterial = new THREE.MeshPhongMaterial({color: wallColor});
          let wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(2 * width + 1 - x - 0.5 - centerX, -lvls + z + 0.5, 2 * y + 0.5 - centerY);
          wall.castShadow = true;
          scene.add( wall );
        }
      }
    }
  }

  // create a directional light
  let directionalLight = new THREE.DirectionalLight(0x303030);

  // set its position
  directionalLight.position.x = 4;
  directionalLight.position.y = 10;
  directionalLight.position.z = 1;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.right   =  width * 1.5;
  directionalLight.shadow.camera.left    = -width * 1.5;
  directionalLight.shadow.camera.top     =  height * 1.5;
  directionalLight.shadow.camera.bottom  = -height * 1.5;
  directionalLight.shadow.camera.far     = 20;
  directionalLight.shadow.camera.near    = 2;
  directionalLight.shadow.mapSize.width  = 2048; // default is 512
  directionalLight.shadow.mapSize.height = 2048; // default is 512
  //directionalLight.shadow.bias = -0.001;
  scene.add(directionalLight);

  let viscam = new THREE.CameraHelper( directionalLight.shadow.camera );
  // scene.add(viscam);

  // create a directional light
  let directionalLight2 = new THREE.DirectionalLight(0x202020);

  // set its position
  directionalLight2.position.x = 0;
  directionalLight2.position.y = -10;
  directionalLight2.position.z = 0;
  scene.add(directionalLight2);

  // create a directional light
  let directionalLight3 = new THREE.DirectionalLight(0x101010);

  // set its position
  directionalLight3.position.x = 0;
  directionalLight3.position.y = 10;
  directionalLight3.position.z = 0;
  scene.add(directionalLight3);

  pointLight = new THREE.PointLight( 0xffffff, 3, width );
  pointLight.position.set( 2 * width + 1 - 1 - 0.5 - centerX, -lvls + 0.5, 1.5 - centerY );
  pointLight.castShadow = true;
  //Set up shadow properties for the light
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.camera.near = 0.02;
  pointLight.shadow.camera.far = width;
  scene.add( pointLight );

  //let light = new THREE.AmbientLight( 0x101000 ); // soft yellow light
  let light = new THREE.AmbientLight( 0x202020 );
  scene.add( light );

  renderH = new RenderHelper(/*RenderHelper.FULLSCREEN | RenderHelper.ADDTOBODY, 500, 300, null, true*/);
  renderH.autoResizing = true;
  renderH.scene = scene;
  renderH.camera = camera;
  renderH.cameraPosition = [0, 60, -height * 0.5 - 10];
  renderH.camHelper.xAngle = 0.4 * Math.PI;
  renderH.camHelper.yAngle = Math.PI;
  renderH.cameraMoveDelta = 0.2;
  renderH.render();

  window.addEventListener('keydown', (ev) => {
    const key = ev.key.toLowerCase();
    if (key === 'u' || key === 'h' || key === 'j' || key === 'k') {
      if (key === 'u') { // up
        pointLight.position.z += 2;
      } else if (key === 'h') { // left
        pointLight.position.x += 2;
      } else if (key === 'j') { // down
        pointLight.position.z -= 2;
      } else if (key === 'k') { // right
        pointLight.position.x -= 2;
      }
      renderH.render();
    }
  });
}
