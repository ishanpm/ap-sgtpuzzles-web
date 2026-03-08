/**
 * @readonly
 * @enum {string}
 */
export const genres = [
    "blackbox","bridges","cube","dominosa","fifteen","filling","flip","flood","galaxies",
    "guess","inertia","keen","lightup","loopy","magnets","map","mines","mosaic","net",
    "netslide","palisade","pattern","pearl","pegs","range","rect","samegame","signpost",
    "singles","sixteen","slant","solo","tents","towers","tracks","twiddle","undead",
    "unequal","unruly","untangle","group",

    "abcd", "ascent", "boats", "bricks", "clusters", "crossing", "mathrax", "rome",
    "salad", "seismic", "spokes", "sticks", "subsets"
]

/**
 * @typedef {Object} ParameterFormatProperty
 * @property {string} key Internal identifier for this property
 * @property {string} name Human-readable name for this property
 * @property {('boolean'|'choice'|'number'|'string')} type Type of this property
 * @property {number} [min] Minimum allowed value for numeric or choice properties
 * @property {number} [max] Maximum allowed value for numeric or choice properties
 * 
 * @typedef {Object} ParameterFormatCodeComponent
 * @property {string} key Internal identifier for this property
 * @property {string} [prefix] Prefix for string component
 * @property {{[x: (string|number)]: string}} [values] Mapping from internal value to string encoding
 * 
 * 
 * @typedef {Object} ParameterFormatLabelComponent
 * @property {string} key Internal identifier for this property
 * @property {string} [format] Format for string component, with `{}` substituted for the value
 * @property {{[x: (string|number)]: string}} [values] Mapping from internal value to string encoding
 * 
 * @typedef {Object} ParameterFormat
 * @property {ParameterFormatProperty[]} properties Parameters, as sent to the Puzzles midend
 * @property {ParameterFormatCodeComponent[]} codeFormat Format for parameter strings
 * @property {ParameterFormatLabelComponent[]} labelFormat Format for pretty-printing
 * 
 * @typedef {Object} GenreInfoEntry
 * @property {string} name
 * @property {string} [description]
 * @property {string} [helpLink] Link to the help page for this puzzle. If undefined, defaults to the empty string. 
 * @property {string[]} [rules]
 * @property {any} [controls]
 * @property {ParameterFormat} [params]
 * @property {boolean} [hidden]
 */

/**
 * @type {{[x: genres]: GenreInfoEntry}}
 */
export const genreInfo = {
    "blackbox": {
        name: "Blackbox",
        description: "Use beam reflections to locate the hidden marbles.",
        rules: [
            "Click a wall on the border to fire a beam from it.",
            "Numbers indicate that a beam leaving from one wall will hit the wall with the same number.",
            "An H indicates that the beam will hit a marble.",
            "An R indicates that the beam will be reflected to the same wall.",
            "When a beam enters a tile diagonally adjacent to a marble, it will be deflected 90 degrees away from it.",
            "When a beam enters a tile diagonally adjacent to two marbles, it will be reflected back the way it came.",
            "If a marble is diagonally adjacent to a wall, it will reflect beams from that wall back to the same wall.",
            "Beams are not reflected if a marble is directly in front of them.",
            "(There may be multiple solutions. Any solution which satisfies every available clue, including unrevealed ones, will be accepted.)"
        ],
        controls: {
            primary: "Toggle marble; Fire laser",
            secondary: "Freeze cell",
            arrows: "Select cell"
        }
    },
    "bridges": {
        name: "Bridges",
        description: "Connect the islands with the indicated number of bridges.",
        rules: [
            "The total number of bridges extending from an island must equal the island's number.",
            "There are at most 2 bridges between any two islands.",
            "All islands are connected by bridges. (There may be loops.)"
        ]
    },
    "cube": {
        name: "Cube",
        description: "Roll the polyhedron so that all sides are painted blue.",
        rules: [
            "Each time the polyhedron rolls, the face that lands on the board will swap colors with the cell it lands on."
        ]
    },
    "dominosa": {
        name: "Dominosa",
        description: "Place dominoes so that each combination of numbers appears exactly once."
    },
    "fifteen": {
        name: "Fifteen",
        description: "Slide the tiles to arrange them in ascending order.",
        rules: [
            "The top left corner must contain the number 1, with numbers ascending from left to right along a row and then continuing in the row below.",
            "The gap must end in the bottom right corner."
        ]
    },
    "filling": {
        name: "Filling",
        description: "Fill the grid with numbers so that each number is connected to that many of itself.",
        rules: [
            "Every cell must have a number.",
            "Connected cells with the same number form a region.",
            "The area of a region must equal the number it contains.",
            "Some regions may have no given numbers, and must be discovered."
        ]
    },
    "flip": {
        name: "Flip",
        description: "Flip all the tiles to white.",
        rules: [
            "The squares in the center of each tile indicate which tiles will be flipped when you click it, with the filled square representing the tile itself."
        ]
    },
    "flood": {
        name: "Flood",
        description: "Make the board a single color using flood-fills.",
        rules: [
            "Each move, change the upper left tile and all connected tiles of the same color to any other color.",
            "Change all tiles to the same color within the move limit to win."
        ]
    },
    "galaxies": {
        name: "Galaxies",
        description: "Divide the grid into rotationally symmetric regions.",
        rules: [
            "Every region must contain exactly one circle.",
            "Each region must have half-turn symmetry about its circle.",
            "Circles cannot lie on region borders.",
            "Regions cannot have internal walls."
        ]
    },
    "group": {
        name: "Group",
        description: "Fill in the <a href='https://en.wikipedia.org/wiki/Cayley_table'>Cayley table</a> for a finite group.",
        hidden: true,
        helpLink: "",
        rules: [
            "In this summary, the letter at row x and column y is notated (xy).",
            "Every letter appears exactly once in each row and column.",
            "For any letters x, y, and z, ((xy)z) and (x(yz)) are the same. (Associativity law)",
            "There is some letter e where, for all x, (ex) and (xe) are both x. (Identity law)",
            "For each letter x, there is some letter y for which (xy) and (yx) are both e, as defined in the identity law. (Inverses law)",
            "(Note: This puzzle is unfinished. See <a href='https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/group.html'>https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/group.html</a> for details.)"
        ]
    },
    "guess": {
        name: "Guess",
        description: "Guess the hidden color pattern.",
        rules: [
            "Black circles indicate how many pegs are correct.",
            "White circles indicate how many pegs are the right color, but in the wrong location.",
            "Colors may repeat (unless forbidden by the game type).",
            "Empty slots are not allowed (unless allowed by the game type)."
        ]
    },
    "inertia": {
        name: "Inertia",
        description: "Collect all the gems while avoiding the mines.",
        rules: [
            "The ball may move in any orthogonal or diagonal direction.",
            "When moved, the ball will continue to move in the same direction until it collides with a wall or the edge of the board.",
            "The ball will collect any gems it passes over.",
            "The ball will be destroyed if it passes over a mine.",
            "The ball will stop moving if it passes over a stop (indicated a dashed circle).",
            "Collecting the last gem and hitting a mine in the same movement does not count as a victory."
        ]
    },
    "keen": {
        name: "Keen",
        description: "Fill in numbers to satisfy mathematical operations.",
        rules: [
            "Each row and column contains the numbers from 1 to the grid size exactly once.",
            "Each region's numbers, when combined with the indicated operation, must form the indicated value.",
            "If the operation is not specified, the numbers are combined using multiplication.",
            "Regions can contain the same number multiple times."
        ]
    },
    "lightup": {
        name: "Lightup",
        description: "Light up the whole grid without shining lights on each other.",
        rules: [
            "Lights illuminate all cells in the same row and column, stopping at shaded cells.",
            "Lights must not be illuminated by other lights.",
            "Numbers indicate how many lights are in the orthogonally adjacent cells."
        ]
    },
    "loopy": {
        name: "Loopy",
        description: "Draw a loop that touches each clue the indicated number of times.",
        rules: [
            "The loop cannot branch or cross itself.",
            "Numbers indicate how many loop segments surround the cell."
        ]
    },
    "magnets": {
        name: "Magnets",
        description: "Place magnets without letting similar polarities touch.",
        rules: [
            "All cells must contain a magnet or be marked empty.",
            "Magnets consist of a plus and a minus.",
            "Numbers above and to the left of the grid indicate how many cells in that row or column contain a plus.",
            "Numbers below and to the right of the grid indicate how many cells in that row or column contain a minus.",
            "Pluses and minuses must not be orthogonally adjacent to identical symbols."
        ]
    },
    "map": {
        name: "Map",
        description: "Color the map using only four colors."
    },
    "mines": {
        name: "Mines",
        description: "Open every cell without clicking mines.",
        rules: [
            "Numbers indicate the number of mines in the surrounding 3x3 area.",
            "The board must have the indicated total number of mines.",
            "The cell marked with an X, if present, is guaranteed to be safe.",
            "If there is no marked cell, the first click is guaranteed to be safe."
        ]
    },
    "mosaic": {
        name: "Mosaic",
        description: "Shade some cells so that each clue is near the indicated number of shaded cells.",
        rules: [
            "All cells must be either shaded or unshaded.",
            "Clues indicate the number of shaded cells in the 3x3 area surrounding the clue.",
            "(By default, shaded cells are black, unshaded cells are white, and undecided cells are teal. Client-side mods may affect this.)"
        ]
    },
    "net": {
        name: "Net",
        description: "Rotate pieces to form a connected network.",
        rules: [
            "Loops are not allowed.",
            "Dead-ends are not allowed, except at the given blue and black boxes.",
            "The network cannot pass through red borders.",
            "The board may wrap, unless it is surrounded by a red border."
        ]
    },
    "netslide": {
        name: "NetSlide",
        description: "Slide rows and columns to form a connected network.",
        rules: [
            "Loops are not allowed.",
            "Dead-ends are not allowed, except at the given blue and black boxes.",
            "The network cannot pass through red borders.",
            "The board may wrap, unless it is surrounded by a red border.",
            "The row and columnn containing the black box cannot move."
        ]
    },
    "palisade": {
        name: "Palisade",
        description: "Divide the grid into regions of a given area.",
        rules: [
            "All regions must have the indicated area.",
            "Numbers indicate how many region borders surround the cell.",
            "Regions cannot have internal borders."
        ]
    },
    "pattern": {
        name: "Pattern",
        description: "Shade some cells so that each row and column has blocks of the indicated lengths.",
        rules: [
            "All cells must be either shaded or unshaded.",
            "Numbers indicate the lengths of all runs of shaded cells within their row or column, as well as their order.",
            "Runs of shaded cells must be separated by at least one unshaded cell.",
            "(By default, shaded cells are black, unshaded cells are white, and undecided cells are gray. Client-side mods may affect this.)"
        ]
    },
    "pearl": {
        name: "Pearl",
        description: "Draw a loop that follows the rules of all the pearls.",
        rules: [
            "The loop must turn at each black pearl, and go straight in both the cells immediately before and after it.",
            "The loop must go straight at each white pearl, and turn in either the cell immediately before or after it (or both).",
            "The loop must touch every pearl."
        ]
    },
    "pegs": {
        name: "Pegs",
        description: "Capture pegs by hopping them over each other until only one remains.",
        rules: [
            "Pegs move by hopping over exactly one orthogonally adjacent peg.",
            "When a peg is hopped over, it is removed."
        ]
    },
    "range": {
        name: "Range",
        description: "Shade cells so that each clue sees the indicated number of ushaded cells.",
        rules: [
            "Clues indicate the total number of unshaded cells reachable in a horizontal or vertical line from the clue, including itself.",
            "Clues cannot be shaded.",
            "Shaded cells cannot be adjacent.",
            "The unshaded cells must all be connected."
        ]
    },
    "rect": {
        name: "Rect",
        description: "Divide the grid into rectangles with the indicated areas.",
        rules: [
            "All regions must be rectangular.",
            "Numbers indicate the area of the enclosing region.",
            "Regions can contain multiple numbers, or none at all."
        ]
    },
    "samegame": {
        name: "SameGame",
        description: "Clear the grid by removing connected groups of colored blocks.",
        rules: [
            "Only same-colored groups of at least two blocks can be removed.",
            "Blocks fall individually until they land on another block or the edge of the board.",
            "If a column is empty, all blocks to the right slide left to close the gap."
        ]
    },
    "signpost": {
        name: "Signpost",
        description: "Number the cells so that each cell points to the next."
    },
    "singles": {
        name: "Singles",
        description: "Shade some numbers so that there are no duplicates in a row or column.",
        rules: [
            "Unshaded cells in the same row or column cannot have the same number.",
            "Shaded cells cannot be adjacent.",
            "The unshaded cells must all be connected."
        ]
    },
    "sixteen": {
        name: "Sixteen",
        description: "Slide rows and columns to arrange the numbers in ascending order.",
        rules: [
            "The top left corner must contain the number 1, with numbers ascending from left to right along a row and then continuing in the row below.",
        ]
    },
    "slant": {
        name: "Slant",
        description: "Draw a slant in each cell so each clue touches the given number of lines.",
        rules: [
            "Each cell must contain a diagonal line.",
            "Clues indicate how many lines touch that vertex.",
            "Lines must not form loops."
        ]
    },
    "solo": {
        name: "Solo",
        description: "Fill in numbers so there are no duplicates in a row, column, or block.",
        rules: [
            "Each row, column, and thick-bordered region contains the numbers from 1 to the grid size exactly once.",
            "If the diagonals are shaded, numbers must not repeat along a diagonal. (X Sudoku)",
            "Cages with thin outlines, if present, must sum to the indicated value. Numbers cannot repeat within a cage. (Killer Sudoku)"
        ]
    },
    "tents": {
        name: "Tents",
        description: "Place a tent next to each tree so that none of them touch.",
        rules: [
            "Each tree must be orthogonally adjacent to its own tent, and each tent must be orthogonally adjacent to its own tree.",
            "A tent can be next to multiple trees, but it must be possible to pair the tents and trees without overlaps.",
            "Tents cannot touch, not even diagonally.",
            "Clues indicate the number of tents in a row or column."
        ]
    },
    "towers": {
        name: "Towers",
        description: "Place towers so that the indicated amount can be seen from outside.",
        rules: [
            "Each row and column must contain the numbers from 1 to the grid size once each, representing the height of the tower in that cell.",
            "Clues indicate how many towers they see in their row or column.",
            "Clues cannot see smaller towers past larger ones."
        ]
    },
    "tracks": {
        name: "Tracks",
        description: "Draw train tracks from A to B that occupy the indicated numbers of cells in each row and column.",
        rules: [
            "There cannot be any isolated tracks.",
            "Tracks cannot branch or cross over each other."
        ]
    },
    "twiddle": {
        name: "Twiddle",
        description: "Rotate blocks of numbers to arrange them in ascending order.",
        rules: [
            "The top left corner must contain the number 1, with numbers ascending from left to right along a row and then continuing in the row below.",
            "Triangles, if present, must point upwards."
        ]
    },
    "undead": {
        name: "Undead",
        description: "Place monsters so that the indicated amount can be seen through the mirrors.",
        rules: [
            "The total quantity of each monster is indicated above the grid.",
            "Clues around the edge indicate how many monsters can be seen in a straight line from there.",
            "Pre-placed diagonal lines are mirrors.",
            "Vampires can't be seen through mirrors.",
            "Ghosts can only be seen through mirrors.",
            "Zombies are always visible.",
            "Monsters may be counted multiple times if a sightline crosses its own path."
        ]
    },
    "unequal": {
        name: "Unequal",
        description: "Fill in numbers so that the inequality signs are satisfied.",
        rules: [
            "Each row and column contains the numbers from 1 to the grid size exactly once.",
            "Cells separated by a greater than or less than sign must satisfy that inequality.",
            "If there are grey bars, numbers separated by grey bars must have a difference of 1.",
            "If there are grey bars, numbers not separated by grey bars must have a difference of more than 1."
        ]
    },
    "unruly": {
        name: "Unruly",
        description: "Shade cells so that no line of three cells has the same color.",
        rules: [
            "All cells must be shaded or unshaded.",
            "There must not be any horizontal or vertical line of three shaded cells or three unshaded cells.",
            "Each row and column must have an equal number of shaded cells and unshaded cells."
        ]

    },
    "untangle": {
        name: "Untangle",
        description: "Untangle the graph so that no edges cross."
    },
    "none": {
        name: "No puzzle loaded",
        description: "Click a puzzle to start it.",
        helpLink: ""
    }
}

for (let genre of ["abcd", "ascent", "boats", "bricks", "clusters", "crossing", "mathrax", "rome",
    "salad", "seismic", "spokes", "sticks", "subsets"]) {
    genreInfo[genre] = {
        name: genre,
        description: "Unsupported puzzle; subject to change.",
        helpLink: "https://github.com/x-sheep/puzzles-unreleased",
        hidden: true,
        evenMoreHidden: true
    }
}