/**
 * Provides utilities for controling the camera via the keyboard
 */
class CameraHelper {
  /**
   * Create a new CameraHelper
   * @param {THREE.Camera} camera - the camera
   * @param {vec3} position - the camera position
   * @param {boolean} displayHelpText - whether to display a text box providing hints
   * (default is false)
   */
  constructor(camera, position, displayHelpText = false) {
    this.camera = camera;
    this.position = position;
    this.target = new THREE.Vector3();
    this.angleX = 0.0;
    this.angleY = 0.0;
    this.autoCameraMove = true;
    this.cameraMoveDelta = 0.1;
    this.cameraRotateDelta = 0.02;
    this.keyDown = this.keyDown.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.posChangedCallback = [];
    this.helpTextElem = document.createElement('div');
    this.helpTextElem.innerHTML = `
      [w], [a], [s], [d]: In Blickrichtung auf gleicher H&ouml;he entlangbewegen<br>
      [q], [e]: H&ouml;he &auml;ndern<br>
      [&larr;], [&uarr;], [&rarr;], [&darr;]: Kamera drehen`;
    this.helpTextElem.style.position = 'fixed';
    this.helpTextElem.style.zIndex = '5';
    this.helpTextElem.style.right = '0.2em';
    this.helpTextElem.style.bottom = '0.2em';
    this.helpTextElem.style.padding = '0.5em';
    this.helpTextElem.style.borderRadius = '0.25em';
    this.helpTextElem.style.backgroundColor = '#fffde7';
    this.helpTextElem.style.color = '#2e7d32';
    this.helpTextElem.style.fontFamily = 'Muli, \'Segoe UI\', Roboto, sans-serif';
    this.helpTextVisible = false;
    this.displayHelpText = displayHelpText;
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keypress', (e) => this.keyPress(e));
    window.addEventListener('keyup', (e) => this.keyUp(e));
  }

  /**
   * Set the displayHelpText property
   * @param {boolean} dht - the new property value
   */
  set displayHelpText(dht) {
    if (dht && !this.helpTextVisible) {
      document.body.appendChild(this.helpTextElem);
      this.helpTextVisible = true;
    } else if (!dht && this.helpTextVisible) {
      document.body.removeChild(this.helpTextElem);
      this.helpTextVisible = false;
    }
  }

  /**
   * Add a new event listener
   * @param {string} type - the type of the listener (e.g. 'change' for listening
   * for a change of the camera postion)
   * @param {function} listener - the listener
   */
  addEventListener(type, listener) {
    if (type === 'change')
      this.posChangedCallback.push(listener);
  }

  /**
   * This method will be called when a key is pressed
   * @param {KeyboardEvent} ev - the corresponding event
   */
  keyDown(ev) {
    let posChanged = false;
    if (this.autoCameraMove) {
      if (ev.key.toLowerCase() === 'q') { // move up
        this.position[1] += this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'e') { // move down
        this.position[1] -= this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'a') { // move left
  			this.position[2] += Math.sin(this.angleY) * this.cameraMoveDelta;
  			this.position[0] -= Math.cos(this.angleY) * this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'd') { // move right
  			this.position[2] -= Math.sin(this.angleY) * this.cameraMoveDelta;
  			this.position[0] += Math.cos(this.angleY) * this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'w') { // move forward
  			this.position[2] -= Math.cos(this.angleY) * this.cameraMoveDelta;
  			this.position[0] -= Math.sin(this.angleY) * this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 's') { // move back
  			this.position[2] += Math.cos(this.angleY) * this.cameraMoveDelta;
  			this.position[0] += Math.sin(this.angleY) * this.cameraMoveDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'arrowleft') { // look left
        this.angleY += this.cameraRotateDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'arrowright') { // look right
        this.angleY -= this.cameraRotateDelta;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'arrowup') { // look up
        this.angleX -= this.cameraRotateDelta;
        if (this.angleX <= -Math.PI/2) this.angleX = -Math.PI/2;
        posChanged = true;
      } else if (ev.key.toLowerCase() === 'arrowdown') { // look down
        this.angleX += this.cameraRotateDelta;
        if (this.angleX >= Math.PI/2) this.angleX = Math.PI/2;
        posChanged = true;
      }
    }
    if (posChanged)
      this.updateCameraPosition();
  }

  /**
   * This method will be called when a key is pressed
   * @param {KeyboardEvent} ev - the corresponding event
   */
  keyPress(ev) {

  }

  /**
   * This method will be called when a key is pressed
   * @param {KeyboardEvent} ev - the corresponding event
   */
  keyUp(ev) {

  }

  /**
   * Update the camera position with regard to the viewing angles
   */
  updateCameraPosition() {
    this.camera.position.x = this.position[0] + Math.sin(this.angleY) * Math.cos(this.angleX) * 0.1;
    this.camera.position.y = this.position[1] + Math.sin(this.angleX) * 0.1;
    this.camera.position.z = this.position[2] + Math.cos(this.angleY) * Math.cos(this.angleX) * 0.1;
    this.target.x = this.position[0];
    this.target.y = this.position[1];
    this.target.z = this.position[2];
    this.camera.lookAt( this.target );
    for (let i = 0; i < this.posChangedCallback.length; i++)
      this.posChangedCallback[i]();
  }

  /**
   * Set the camera y angle (rotation around the y axis, which points upwards)
   * @param {number} val - the new y angle
   */
  set yAngle(val) {
    this.angleY = val;
    this.updateCameraPosition();
  }

  /**
   * Set the camera x angle
   * @param {number} val - the new x angle, between pi / 2 (down) and -pi / 2 (up)
   */
  set xAngle(val) {
    this.angleX = val;
    this.updateCameraPosition();
  }
}
