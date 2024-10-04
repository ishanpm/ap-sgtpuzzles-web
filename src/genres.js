/**
 * @readonly
 * @enum {string}
 */
export const genres = [
    "blackbox","bridges","cube","dominosa","fifteen","filling","flip","flood","galaxies",
    "group","guess","inertia","keen","lightup","loopy","magnets","map","mines","mosaic","net",
    "netslide","palisade","pattern","pearl","pegs","range","rect","samegame","signpost",
    "singles","sixteen","slant","solo","tents","towers","tracks","twiddle","undead",
    "unequal","unruly","untangle"
];

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
            "Beams are not reflected if a marble is directly in front of them."
        ],
        controls: {
            primary: "Toggle marble; Fire laser",
            secondary: "Freeze cell",
            arrows: "Select cell"
        }
    },
    "bridges": {
        name: "Bridges",
        description: "Connect the islands with the indicated number of bridges."
    },
    "cube": {
        name: "Cube",
        description: "Roll the polyhedron so that all sides are painted blue."
    },
    "dominosa": {
        name: "Dominosa",
        description: "Place dominoes so that each combination of numbers appears once."
    },
    "fifteen": {
        name: "Fifteen",
        description: "Slide the tiles to arrange them in ascending order."
    },
    "filling": {
        name: "Filling",
        description: "Fill the grid with numbers so that each number is connected to that many of itself."
    },
    "flip": {
        name: "Flip",
        description: "Flip all the tiles to white."
    },
    "flood": {
        name: "Flood",
        description: "Make the board a single color using flood-fills."
    },
    "galaxies": {
        name: "Galaxies",
        description: "Divide the grid into rotationally symmetric regions."
    },
    "group": {
        name: "Group",
        description: "Fill in the Cayley table for a finite group.",
        hidden: true,
        helpLink: "",
        rules: [
            "Every letter appears exactly once in each row and column.",
            "The letter at row x and column y is notated (xy).",
            "For any letters x, y, and z, ((xy)z) and (x(yz)) are the same.",
            "There is some letter e for which, for any x, (ex) and (xe) are both x."
        ]
    },
    "guess": {
        name: "Guess",
        description: "Guess the hidden color pattern.",
        rules: [
            "Black circles indicate how many pegs are correct.",
            "white circles indicate how many pegs are the right color, but in the wrong location."
        ]
    },
    "inertia": {
        name: "Inertia",
        description: "Collect all the gems while avoiding the mines."
    },
    "keen": {
        name: "Keen",
        description: "Fill in numbers to satisfy mathematical operations."
    },
    "lightup": {
        name: "Lightup",
        description: "Light up the whole grid without shining lights on each other."
    },
    "loopy": {
        name: "Loopy",
        description: "Draw a loop that touches each clue the right number of times."
    },
    "magnets": {
        name: "Magnets",
        description: "Place magnets without letting similar polarities touch."
    },
    "map": {
        name: "Map",
        description: "Color the map using only four colors."
    },
    "mines": {
        name: "Mines",
        description: "Open every cell without clicking mines."
    },
    "mosaic": {
        name: "Mosaic",
        description: "Shade some cells so that each clue touches the right number of shaded cells."
    },
    "net": {
        name: "Net",
        description: "Rotate pieces to form a connected network."
    },
    "netslide": {
        name: "NetSlide",
        description: "Slide rows and columns to form a connected network."
    },
    "palisade": {
        name: "Palisade",
        description: "Divide the grid into regions of a given area."
    },
    "pattern": {
        name: "Pattern",
        description: "Shade some cells so that each row and column has blocks of the indicated lengths."
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
        description: "Capture pegs by hopping them over each other until only one remains."
    },
    "range": {
        name: "Range",
        description: "Shade cells so that each clue sees the indicated number of ushaded cells.",
        rules: [
            "Clues indicate the total number of unshaded cells reachable in a horizontal or vertical line from the clue, including itself.",
            "Shaded cells cannot be adjacent.",
            "The unshaded cells must all be connected."
        ]
    },
    "rect": {
        name: "Rect",
        description: "Divide the grid into rectangles with the indicated areas."
    },
    "samegame": {
        name: "SameGame",
        description: "Clear the grid by removing connected groups of colored blocks."
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
        description: "Slide rows and columns to arrange the numbers in ascending order."
    },
    "slant": {
        name: "Slant",
        description: "Draw a slant in each cell so each clues touches the given number of lines."
    },
    "solo": {
        name: "Solo",
        description: "Fill in numbers so there are no duplicates in a row, column, or block."
    },
    "tents": {
        name: "Tents",
        description: "Place a tent next to each tree so that none of them touch."
    },
    "towers": {
        name: "Towers",
        description: "Place towers so that the right amount can be seen from outside."
    },
    "tracks": {
        name: "Tracks",
        description: "Draw train tracks from A to B that occupy the right numbers of cells in each row and column."
    },
    "twiddle": {
        name: "Twiddle",
        description: "Rotate blocks of numbers to arrange them in ascending order."
    },
    "undead": {
        name: "Undead",
        description: "Place monsters so that the right number can be seen through the mirrors.",
        rules: [
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
        description: "Fill in numbers so that the inequality signs are satisfied."
    },
    "unruly": {
        name: "Unruly",
        description: "Shade cells so that no line of three cells has the same color."

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