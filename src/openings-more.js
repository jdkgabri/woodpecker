// More opening courses, built around a branching tree (lines with treeOnly: true only open the
// tree). Same format as openings-data.js; the trees are in public/openings/trees/ and their notes
// in public/openings/notes/.
const tree = (file, name, moves, summary) => ({ id: file, name, moves, treeOnly: true, tree: { file }, ...(summary ? { summary } : {}) });

export const MORE_OPENINGS = [
];
