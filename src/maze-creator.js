/**
 * Generates 2D Mazes
 * 
 * Mazes have the following format:
 * maze[z][y][x] in {0, 1} where 0 is passage, 1 is wall
 * - z dimension is number of levels * 2 + 1 (one floor and wall level for each level + ceiling)
 * - z mod 2 == 0 indicates a floor level
 *   - on floor levels, the dimension is just width * height, where every cell might contain a
 *     trapdoor or solid floor
 * - z mod 2 == 1 indicates a wall level
 *   - y dimension is height * 2 + 1
 *   - y mod 2 == 0 indicates horizontal walls
 *     - x dimension is then equal to the width
 *   - y mod 2 == 1 indicates vertical walls
 *     - x dimension is then equal to the width + 1
 */
class MazeCreator {
  /**
   * Select next coordinate value
   * @param {number} xcoord current x coordinate value
   * @param {number} ycoord current y coordinate value
   * @param {number} zcoord current z coordinate value
   * @param {number} xmax maximum x coordinate value
   * @param {number} ymax maximum y coordinate value
   * @param {number} zmax maximum z coordinate value
   * @param {number} [xmin] minimum x coordinate value
   * @param {number} [ymin] minimum y coordinate value
   * @param {number} [zmin] minimum z coordinate value
   * @return {number[]} [x, y, z] randomly selected next value
   */
  static randomSelectNext(xcoord, ycoord, zcoord, xmax, ymax, zmax, xmin = 0, ymin = 0, zmin = 0) {
    const posFields = [];
    for (let x = xcoord - 1; x <= xcoord + 1; x++)
      for (let y = ycoord - 1; y <= ycoord + 1; y++)
        for (let z = zcoord - 1; z <= zcoord + 1; z++)
          if (x >= xmin && x <= xmax && y >= ymin && y <= ymax && z >= zmin && z <= zmax
              && (Math.abs(x - xcoord) + Math.abs(y - ycoord) + Math.abs(z - zcoord) == 1))
            posFields.push([x, y, z]);
    if (posFields.length == 0)
      throw new Error('MazeCreator.randomSelectNext(): no neighboring fields.');
    return posFields[Math.floor(Math.random() * posFields.length)];
  }

  /**
   * Get the wall coordinates of a wall between to given cells in a maze array. All coordinates
   * 0-indexed.
   * @param {number} x1 first cell x coordinate
   * @param {number} y1 first cell y coordinate
   * @param {number} z1 first cell z coordinate
   * @param {number} x2 second cell x coordinate
   * @param {number} y2 second cell y coordinate
   * @param {number} z2 second cell z coordinate
   * @return {number[]} [z, y, x] coordinates for a maze array
   */
  static getWallBetween(x1, y1, z1, x2, y2, z2) {
    if (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2) != 1)
      throw new Error(`MazeCreator.getWallBetween(): Manhattan distance was ${
        Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)}, but only 1 allowed.`);
    const max = (a, b) => a > b ? a : b;
    if (Math.abs(x1 - x2) == 1)
      return [z1 * 2 + 1, y1 * 2 + 1, max(x1, x2)];
    if (Math.abs(y1 - y2) == 1)
      return [z1 * 2 + 1, max(y1, y2) * 2, x1];
    return [max(z1, z2) * 2, y1, x1];
  }

  /**
   * Create a maze using Wilson's algorithm (will not contain loops)
   * https://en.wikipedia.org/w/index.php?title=Maze_generation_algorithm&oldid=900087849#Wilson's_algorithm
   * @param {number} [x] width
   * @param {number} [y] height
   * @param {number} [z] levels
   * @param {number} [steplimit] maximum number of random walk steps
   * @return {number[][][]} randomly generated maze
   */
  static wilsonMaze(x = 20, y = 20, z = 1, steplimit = 1000000) {
    if (x < 2) x = 2; if (y < 2) y = 2; if (z < 1) z = 1;
    const cells = []; // saves which cells were used already (0: unused, 1: this walk, 2: used)
    const retMaze = []; // maze array that will be returned
    let freeCells = x * y * z - 1; // number of free cells
    let nextUnused = [1, 0, 0]; // next unused cell [x, y, z] (inverse lexicographic order, meaning z is most significant)

    // init cells as unused
    for (let zv = 0; zv < z; zv++) {
      cells[zv] = [];
      for (let yv = 0; yv < y; yv++) {
        cells[zv][yv] = [];
        for (let xv = 0; xv < x; xv++) {
          cells[zv][yv][xv] = 0;
        }
      }
    }
    cells[0][0][0] = 2;

    // init retMaze
    for (let zv = 0; zv < z * 2 + 1; zv++) {
      retMaze[zv] = [];
      for (let yv = 0; yv < (zv % 2 == 0 ? y : y * 2 + 1); yv++) {
        retMaze[zv][yv] = [];
        for (let xv = 0; xv < (zv % 2 == 0 ? x : (yv % 2 == 0 ? x : x + 1)); xv++) {
          retMaze[zv][yv][xv] = 1; // wall
        }
      }
    }

    let steps = 0;
    // create maze without loops
    const coordCmp = (a, b) => {
      for (let i = 0; i < 3; i++)
        if (a[i] != b[i]) return false;
      return true;
    };
    while (freeCells > 0 && steps < steplimit) {
      let [cx, cy, cz] = nextUnused; let bx, by, bz;
      const stack = [];
      while (cells[cz][cy][cx] <= 1 && steps < steplimit) {
        steps++;
        if (cells[cz][cy][cx] == 1) {
          while (!coordCmp(stack[stack.length - 1], [cx, cy, cz])) {
            [bx, by, bz] = stack.pop();
            cells[bz][by][bx] = 0;
            freeCells++;
          }
        } else {
          cells[cz][cy][cx] = 1; freeCells--;
          stack.push([cx, cy, cz]);
        }
        [cx, cy, cz] = MazeCreator.randomSelectNext(cx, cy, cz, x - 1, y - 1, z - 1);
      }
      stack.push([cx, cy, cz]);
      for (let i = 0; i < stack.length; i++) {
        [cx, cy, cz] = stack[i];
        cells[cz][cy][cx] = 2;
        if (i > 0) {
          let [zv, yv, xv] = MazeCreator.getWallBetween(cx, cy, cz, bx, by, bz);
          retMaze[zv][yv][xv] = 0; // no wall
        }
        [bx, by, bz] = [cx, cy, cz];
      }
      if (freeCells > 0) {
        [cx, cy, cz] = nextUnused;
        while (cells[cz][cy][cx] != 0) {
          cx++;
          if (cx == x) {
            cx = 0; cy++;
            if (cy == y) {
              cy = 0; cz++;
              if (cz == z) {
                console.warn('MazeCreator.wilsonMaze() - warning: freeCells should have been zero.');
                freeCells = 0;
              }
            }
          }
        }
        nextUnused = [cx, cy, cz];
      }
    }
    if (steps == steplimit)
      console.warn('MazeCreator.wilsonMaze() - warning: step limit reached.');

    return retMaze;
  }

  /**
   * Get a string representation of a maze
   * @param {number[][][]} maze the maze
   * @return {string} a string representation
   */
  static mazeToString(maze) {
    let ret = '';
    const [lvls, height, width] = [(maze.length - 1) / 2, maze[0].length, maze[0][0].length];
    for (let z = 0; z < lvls; z++) {
      ret += `Level ${z + 1}\n`;
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
              if (up && down) ret += 'X';
              else if (up) ret += '/';
              else if (down) ret += '\\';
              else ret += ' ';
            } else { // possibly level wall
              const x2 = x / 2;
              if (x2 > 0 && x2 < width) {
                const [bz, by, bx] = MazeCreator.getWallBetween(x2, y, z, x2 - 1, y, z);
                if (maze[bz][by][bx] == 0) ret += ' ';
                else ret += '#';
              } else ret += '#';
            }
          }
          ret += '\n';
        }
        for (let x = 0; x < 2 * width + 1; x++) {
          if (y < height && y > 0 && x % 2 == 1) {
            const x2 = (x - 1) / 2;
            const [bz, by, bx] = MazeCreator.getWallBetween(x2, y - 1, z, x2, y, z);
            if (maze[bz][by][bx] == 0) ret += ' ';
            else ret += '#';
          } else
            ret += '#';
        }
        ret += '\n';
      }
    }
    return ret;
  }
}