interface CollectionInfo {
    key: string,
    name: string
}

export const genres = [
    "blackbox","bridges","cube","dominosa","fifteen","filling","flip","flood","galaxies",
    "guess","inertia","keen","lightup","loopy","magnets","map","mines","mosaic","net",
    "netslide","palisade","pattern","pearl","pegs","range","rect","samegame","signpost",
    "singles","sixteen","slant","solo","tents","towers","tracks","twiddle","undead",
    "unequal","unruly","untangle","group",

    "abcd","ascent","boats","bricks","clusters","crossing","mathrax","rome","salad","seismic","spokes","sticks","subsets"
] as const;

export const genreCollections: CollectionInfo[] = [
    {
        key: "main",
        name: "Simon Tatham's Portable Puzzle Collection"
    },
    {
        key: "unfinished",
        name: "Unfinished (Simon Tatham's Portable Puzzle Collection)"
    },
    {
        key: "x-sheep",
        name: "x-sheep"
    }
];

export type GenreKey = typeof genres[number] | "none"

export function isGenre(str: string): str is GenreKey {
    const genresAsStr = genres as readonly string[]
    return genresAsStr.includes(str)
}

interface ParameterFormatProperty {
    /** Internal identifier for this property */
    key: string
    /** Human-readable name for this property */
    name: string
    /** Type of this property */
    type: ('boolean'|'choice'|'number'|'string')
    /** Minimum allowed value for numeric properties */
    min?: number
    /** Maximum allowed value for numeric properties */
    max?: number
    /** String keys for possible choices */
    choices?: string[]
}

interface ParameterFormatCodeComponent {
    key: string;
    prefix?: string;
    values?: { [x: (string | number)]: string; };
}

interface ParameterFormatLabelComponent {
    key: string;
    format?: string;
    values?: { [x: (string | number)]: string; };
}

interface ParameterFormat {
    properties: ParameterFormatProperty[];
    codeFormat: ParameterFormatCodeComponent[];
    labelFormat: ParameterFormatLabelComponent[];
}

interface GenreInfoEntry {
    name: string;
    description?: string;
    helpLink?: string;
    rules?: string[];
    controls?: any;
    params?: ParameterFormat;
    collection?: string;
    hidden?: boolean;
    special?: boolean;

    forbidUndo?: boolean;
}

export const genreInfo: {[x in GenreKey]: GenreInfoEntry} = {
    "blackbox": {
        name: "Blackbox",
        collection: "main",
        description: "Use beam reflections to locate the hidden marbles.",
        rules: [
            "Click a wall on the border to fire a beam from it.",
            "Numbers indicate that a beam leaving from that wall will hit the wall with the same number.",
            "An H indicates that the beam will hit a marble.",
            "An R indicates that the beam will be reflected back to the same wall.",
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
        collection: "main",
        description: "Connect the islands with the indicated number of bridges.",
        rules: [
            "The total number of bridges extending from an island must equal the island's number.",
            "There are at most 2 bridges between any two islands.",
            "All islands are connected by bridges. (There may be loops.)"
        ]
    },
    "cube": {
        name: "Cube",
        collection: "main",
        description: "Roll the polyhedron so that all sides are painted blue."
    },
    "dominosa": {
        name: "Dominosa",
        collection: "main",
        description: "Place dominoes so that each combination of numbers appears once."
    },
    "fifteen": {
        name: "Fifteen",
        collection: "main",
        description: "Slide the tiles to arrange them in ascending order."
    },
    "filling": {
        name: "Filling",
        collection: "main",
        description: "Fill the grid with numbers so that each number is connected to that many of itself.",
        rules: [
            "Every cell must have a number.",
            "There may be unclued regions."
        ]
    },
    "flip": {
        name: "Flip",
        collection: "main",
        description: "Flip all the tiles to white."
    },
    "flood": {
        name: "Flood",
        collection: "main",
        description: "Make the board a single color using flood-fills."
    },
    "galaxies": {
        name: "Galaxies",
        collection: "main",
        description: "Divide the grid into rotationally symmetric regions.",
        rules: [
            "Each region must contain exactly one circle.",
            "Each region must have 180 degree rotational symmetry around its circle."
        ]
    },
    "group": {
        name: "Group",
        collection: "unfinished",
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
        collection: "main",
        description: "Guess the hidden color pattern.",
        rules: [
            "Black circles indicate how many pegs are correct.",
            "white circles indicate how many pegs are the right color, but in the wrong location."
        ],
        forbidUndo: true
    },
    "inertia": {
        name: "Inertia",
        collection: "main",
        description: "Collect all the gems while avoiding the mines."
    },
    "keen": {
        name: "Keen",
        collection: "main",
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
        collection: "main",
        description: "Light up the whole grid without shining lights on each other."
    },
    "loopy": {
        name: "Loopy",
        collection: "main",
        description: "Draw a loop that touches each clue the right number of times."
    },
    "magnets": {
        name: "Magnets",
        collection: "main",
        description: "Place magnets without letting similar polarities touch."
    },
    "map": {
        name: "Map",
        collection: "main",
        description: "Color the map using only four colors."
    },
    "mines": {
        name: "Mines",
        collection: "main",
        description: "Open every cell without clicking mines.",
        forbidUndo: true
    },
    "mosaic": {
        name: "Mosaic",
        collection: "main",
        description: "Shade some cells so that each clue is near the right number of shaded cells."
    },
    "net": {
        name: "Net",
        collection: "main",
        description: "Rotate pieces to form a connected network."
    },
    "netslide": {
        name: "NetSlide",
        collection: "main",
        description: "Slide rows and columns to form a connected network."
    },
    "palisade": {
        name: "Palisade",
        collection: "main",
        description: "Divide the grid into regions of a given area."
    },
    "pattern": {
        name: "Pattern",
        collection: "main",
        description: "Shade some cells so that each row and column has shaded blocks of the indicated lengths."
    },
    "pearl": {
        name: "Pearl",
        collection: "main",
        description: "Draw a loop that follows the rules of all the pearls.",
        rules: [
            "The loop must turn at each black pearl, and go straight in both the cells immediately before and after it.",
            "The loop must go straight at each white pearl, and turn in either the cell immediately before or after it (or both).",
            "The loop must touch every pearl."
        ]
    },
    "pegs": {
        name: "Pegs",
        collection: "main",
        description: "Capture pegs by hopping them over each other until only one remains."
    },
    "range": {
        name: "Range",
        collection: "main",
        description: "Shade cells so that each clue sees the indicated number of unshaded cells.",
        rules: [
            "Clues indicate the total number of unshaded cells reachable in a horizontal or vertical line from the clue, including itself.",
            "Shaded cells cannot be adjacent.",
            "The unshaded cells must all be connected."
        ]
    },
    "rect": {
        name: "Rect",
        collection: "main",
        description: "Divide the grid into rectangles with the indicated areas.",
    },
    "samegame": {
        name: "SameGame",
        collection: "main",
        description: "Clear the grid by removing connected groups of colored blocks."
    },
    "signpost": {
        name: "Signpost",
        collection: "main",
        description: "Number the cells so that each cell points to the next."
    },
    "singles": {
        name: "Singles",
        collection: "main",
        description: "Shade some numbers so that there are no duplicates in a row or column.",
        rules: [
            "Unshaded cells in the same row or column cannot have the same number.",
            "Shaded cells cannot be adjacent.",
            "The unshaded cells must all be connected."
        ]
    },
    "sixteen": {
        name: "Sixteen",
        collection: "main",
        description: "Slide rows and columns to arrange the numbers in ascending order."
    },
    "slant": {
        name: "Slant",
        collection: "main",
        description: "Draw a slant in each cell so each clues touches the given number of lines.",
        rules: [
            "Each cell must contain a slant.",
            "Clues represent the number of lines that a given vertex touches.",
            "There cannot be any closed loops."
        ]
    },
    "solo": {
        name: "Solo",
        collection: "main",
        description: "Fill in numbers so there are no duplicates in a row, column, or block.",
        rules: [
            "Each row, column, and block contains the numbers from 1 to the grid size exactly once.",
            "If the diagonals are shaded, numbers must not repeat along a diagonal. (X Sudoku)",
            "Cages with thin outlines, if present, must sum to the indicated value. Numbers cannot repeat within a cage. (Killer Sudoku)"
        ]
    },
    "tents": {
        name: "Tents",
        collection: "main",
        description: "Place a tent next to each tree so that none of them touch.",
        rules: [
            "Each tree must be next to its own tent, and each tent must be next to its own tree.",
            "A tent can be next to multiple trees, but it must be possible to pair the tents and trees without overlaps.",
            "Tents cannot be adjacent, not even diagonally.",
            "Clues indicate the number of tents in a row or column."
        ]
    },
    "towers": {
        name: "Towers",
        collection: "main",
        description: "Place towers so that the right amount can be seen from outside.",
        rules: [
            "Each row and column contains the numbers from 1 to the grid size exactly once.",
            "Clues around the grid indicate how many towers can be seen in a straight line from there.",
            "Towers obscure towers with a smaller number behind them."
        ]
    },
    "tracks": {
        name: "Tracks",
        collection: "main",
        description: "Draw train tracks from A to B that occupy the right numbers of cells in each row and column."
    },
    "twiddle": {
        name: "Twiddle",
        collection: "main",
        description: "Rotate blocks of numbers to arrange them in ascending order."
    },
    "undead": {
        name: "Undead",
        collection: "main",
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
        collection: "main",
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
        collection: "main",
        description: "Shade cells so that no line of three cells has the same color.",
        rules: [
            "No line of three cells in a row or column can be all black or all white.",
            "Each row and column must have an equal number of black and white cells."
        ]

    },
    "untangle": {
        name: "Untangle",
        collection: "main",
        description: "Untangle the graph so that no edges cross."
    },
    "none": {
        name: "No puzzle loaded",
        description: "Click a puzzle to start it.",
        helpLink: "",
        special: true
    },

    "abcd": {name: "abcd", description: "Placeholder", collection: "x-sheep"},
    "ascent": {name: "ascent", description: "Placeholder", collection: "x-sheep"},
    "boats": {name: "boats", description: "Placeholder", collection: "x-sheep"},
    "bricks": {name: "bricks", description: "Placeholder", collection: "x-sheep"},
    "clusters": {name: "clusters", description: "Placeholder", collection: "x-sheep"},
    "crossing": {name: "crossing", description: "Placeholder", collection: "x-sheep"},
    "mathrax": {name: "mathrax", description: "Placeholder", collection: "x-sheep"},
    "rome": {name: "rome", description: "Placeholder", collection: "x-sheep"},
    "salad": {name: "salad", description: "Placeholder", collection: "x-sheep"},
    "seismic": {name: "seismic", description: "Placeholder", collection: "x-sheep"},
    "spokes": {name: "spokes", description: "Placeholder", collection: "x-sheep"},
    "sticks": {name: "sticks", description: "Placeholder", collection: "x-sheep"},
    "subsets": {name: "subsets", description: "Placeholder", collection: "x-sheep"},
}