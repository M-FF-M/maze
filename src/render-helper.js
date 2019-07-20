/**
 * This class makes the setup of the canvas much easier
 */
class RenderHelper {
  /** FULLSCREEN mode flag - sets the canvas size to full screen */
  static get FULLSCREEN() { return 1; }
  /** FIXEDSIZE mode flag - sets a fixed canvas size */
  static get FIXEDSIZE() { return 2; }
  /** USERDEFINED mode flag - allows a dynamic, user defined canvas size */
  static get USERDEFINED() { return 3; }
  /** ADDTOBODY mode flag - adds the canvas to the body element */
  static get ADDTOBODY() { return 1 << 4; }
  /** ADDTOELEMENT mode flag - adds the canvas to a HTMLElement */
  static get ADDTOELEMENT() { return 2 << 4; }
  /** DONTADD mode flag - doesn't add the canvas to the DOM tree */
  static get DONTADD() { return 3 << 4; }

  /**
   * Create a new RenderHelper
   * @param {number} mode - change the mode by using the flags FULLSCREEN, FIXEDSIZE, USERDEFINED,
   * ADDTOBODY, ADDTOELEMENT and DONTADD (combine with bitwise OR)
   * @param {number} width - the width of the canvas (in FIXEDSIZE and USERDEFINED mode)
   * @param {number} height - the height of the canvas (in FIXEDSIZE and USERDEFINED mode)
   * @param {HTMLElement} elem - the HTMLElement the canvas should be added to (in ADDTOELEMENT
   * mode)
   * @param {boolean} doubleRendering - whether to render on two canvases - the canvas on top
   * will have opacity 0.5 and render shadows, the canvas below will not render shadows
   * @param {object} rendererOptions - this object will be passed on to the THREE.WebGLRenderer
   */
  constructor(mode = RenderHelper.FULLSCREEN | RenderHelper.ADDTOBODY, width = 500, height = 300,
              elem = null, doubleRendering = false, rendererOptions = {}) {
    this.constructing = true;
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this.windowResize = this.windowResize.bind(this);
    this.cameraPosChange = this.cameraPosChange.bind(this);
    this.autoResizing = false;
    this.camHelper = new CameraHelper(null, [0, 0, 0], true);
    this.camHelper.addEventListener('change', () => this.cameraPosChange());
    window.addEventListener('resize', () => this.windowResize());
    this.renderLoop = false;
    this.startTime = (new Date()).getTime();
    this.lastTime = this.startTime;
    this.mode = mode;
    const fl_a = this.mode & 0b1111;
    const fl_b = this.mode & 0b11110000;
    this.canvas = document.createElement('canvas');
    this.canvas2 = null;
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;
    this.resize();
    if (fl_b == RenderHelper.ADDTOBODY) {
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = '0px';
      this.canvas.style.top = '0px';
      this.canvas.style.zIndex = '1';
      document.body.appendChild(this.canvas);
      if (fl_a == RenderHelper.FULLSCREEN && doubleRendering) {
        this.canvas2 = document.createElement('canvas');
        this.canvas2.style.position = 'absolute';
        this.canvas2.style.left = '0px';
        this.canvas2.style.top = '0px';
        this.canvas2.style.zIndex = '1';
        this.enableDoubleRendering = true;
        document.body.appendChild(this.canvas2);

        this.canvas.style.opacity = '0.5';
        this.canvas.style.zIndex = '2';
      }
    } else if (fl_b == RenderHelper.ADDTOELEMENT && elem != null)
      elem.appendChild(this.canvas);
    this.renderListeners = [];
    this.wasResized = true;
    this.scene = null;
    if (typeof rendererOptions.alpha === 'undefined') rendererOptions.alpha = true;
    if (typeof rendererOptions.antialias === 'undefined') rendererOptions.antialias = true;
    rendererOptions.canvas = this.canvas;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor( 0xffffff, 0 );
    this.renderer2 = null;
    if (this.enableDoubleRendering) {
      const rendererOptions2 = Object.assign({}, rendererOptions);
      rendererOptions2.canvas = this.canvas2;
      this.renderer2 = new THREE.WebGLRenderer(rendererOptions2);
      this.renderer2.setClearColor( 0xffffff, 0 );
    }
    this.constructing = false;
  }

  /**
   * Add an event listener to this RenderHelper. The listeners will be called with
   * the following parameters:
   * - type 'render': (timeSinceStart, timeSinceLast) where timeSinceStart is the time in
   *   milliseconds since the last resetTimer() call and timeSinceLast is the time in
   *   milliseconds since the last frame (call to render())
   * @param {string} type - the type of event the listener wants to listen to. The following
   * parameters are possible: 'render'
   * @param {Function} listener - the event listener
   */
  addEventListener(type, listener) {
    if (type === 'render') this.renderListeners.push(listener);
  }

  /**
   * Render the current scene in an infinte loop
   */
  animateRender() {
    if (!this.renderLoop) {
      this.renderLoop = true;
      this.render();
    }
  }

  /**
   * Stop the infinite rendering loop
   */
  stopRenderAnimation() {
    this.renderLoop = false;
  }

  /**
   * Reset the internal timer
   */
  resetTimer() {
    this.startTime = (new Date()).getTime();
    this.lastTime = this.startTime;
  }

  /**
   * Returns the time that passed since the last call to timePassed() and since the last
   * call to resetTimer()
   * @return {Array} at index 0: the time in milliseconds since the last resetTimer() call,
   * at index 1: the time in milliseconds since the last timePassed() call
   */
  timePassed() {
    const timeNow = (new Date()).getTime();
    const retTime = timeNow - this.lastTime;
    this.lastTime = timeNow;
    return [timeNow - this.startTime, retTime];
  }

  /**
   * Render the current scene
   * @param {number} reqAniTimestamp - used to receive timestamps from requestAnimationFrame
   * @param {boolean} singleRender - set to true if you only want to render a single frame
   */
  render(reqAniTimestamp = 0.0, singleRender = false) {
    if (!singleRender && this.renderLoop)
      requestAnimationFrame(this.render);

    const time = this.timePassed();
    for (let i = 0; i < this.renderListeners.length; i++)
      this.renderListeners[i](time[0], time[1]);

    if (this.scene === null || this.camHelper.camera === null) {
      console.warn('Unable to render as no scene or no camera was specified!');
      return;
    }

    if (this.wasResized) {
      this.renderer.setSize(this.canvas.width, this.canvas.height);
      if (this.enableDoubleRendering)
        this.renderer2.setSize(this.canvas.width, this.canvas.height);
    }

    if (this.enableDoubleRendering) {
      this.renderer2.render(this.scene, this.camHelper.camera);
      this.renderer.render(this.scene, this.camHelper.camera);
    } else {
      this.renderer.render(this.scene, this.camHelper.camera);
    }
    this.wasResized = false;
  }

  /**
   * This method will be called when the window is resized
   */
  windowResize() {
    const fl_a = this.mode & 0b1111;
    if (fl_a == RenderHelper.FULLSCREEN && this.autoResizing)
      this.resize();
  }

  /**
   * Resize the canvas
   * @param {number} width - the new width of the canvas. This parameter has no effect if this
   * RenderHelper uses FULLSCREEN or FIXEDSIZE mode
   * @param {number} height - the new height of the canvas. This parameter has no effect if this
   * RenderHelper uses FULLSCREEN or FIXEDSIZE mode
   */
  resize(width, height) {
    const fl_a = this.mode & 0b1111;
    if (fl_a == RenderHelper.FULLSCREEN) {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    } else if (fl_a == RenderHelper.FIXEDSIZE) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    } else if (typeof width === 'undefined') {
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    } else {
      this.width = this.canvas.width = width;
      this.height = this.canvas.height = height;
    }
    if (this.camHelper.camera != null) {
      this.camHelper.camera.aspect = this.canvas.width / this.canvas.height;
      this.camHelper.camera.updateProjectionMatrix();
    }
    this.wasResized = true;
    if (!this.constructing)
      this.render(0, true);
  }

  /**
   * This will be called internally when the camera position changes
   */
  cameraPosChange() {
    this.render(0, true);
  }

  /**
   * Set the camera
   * @param {THREE.Camera} cam - the camera
   */
  set camera(cam) {
    this.camHelper.camera = cam;
  }

  /**
   * Set the camera position
   * @param {vec3} pos - the camera position
   */
  set cameraPosition(pos) {
    this.camHelper.position = pos;
    this.camHelper.updateCameraPosition();
  }

  /**
   * Set the whether to automatically move the camera when the user presses the
   * appropriate keys
   * @param {boolean} autoMove - whether to automatically move the camera
   */
  set autoCameraMove(autoMove) {
    this.camHelper.autoCameraMove = autoMove;
  }

  /**
   * Set how far the camera moves when the users presses a key
   * @param {boolean} delta - the distance (in THREE coordinate system units)
   */
  set cameraMoveDelta(delta) {
    this.camHelper.cameraMoveDelta = delta;
  }

  /**
   * Set how far the camera turns when the users presses a key
   * @param {boolean} delta - the distance (in radians)
   */
  set cameraRotateDelta(delta) {
    this.camHelper.cameraRotateDelta = delta;
  }

  /**
   * Set the whether or not to show the camera help text
   * @param {boolean} show - whether to show the camera help text
   */
  set cameraHelpText(show) {
    this.camHelper.displayHelpText = show;
  }
}
