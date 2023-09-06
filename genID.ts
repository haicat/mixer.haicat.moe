export const IDNouns = [
	"apple", "ant", "apricot", "armor", "art", "area", "ale",
	"box", "barrel", "bow", "brew", "barding", "bard", "barbarian", "bird", "bride",
	"corner", "creature", "cart", "crossbow", "cleric", "crown", "clergy",
	"door", "dungeon", "dragon", "dice",
	"elk", "effigy", "exterior", "elf",
	"falcon", "fox", "fish", "fellow", "fighter",
	"game", "grove", "guild",
	"halfling", "harpoon", "horn", "herring",
	"ibex", "ice", "ichor",
	"jester", "judge", "jack", "job",
	"kobold", "keep", "khan", "knife", "knight", "knave",
	"leaf", "leader", "labyrinth", "luck", "lie", "lantern", "lizard",
	"monk", "meadow", "marsh", "meal", "mead", "miasma", "mob", "moat", "mud", "magic",
	"noble", "nymph", "nail",
	"oak", "oat", "obelisk", "offering", "ogre", "oil", "olive", "opal", "opera", "orc", "osprey", "owl", "ox", "oyster",
	"pearl", "plague", "pork", "pub", "pyramid", "paladin",
	"quail", "quadrant",
	"raccoon", "reality", "road", "robin", "robe", "roar", "rubble", "ruby", "rogue",
	"saber", "scimitar", "sea", "shadow", "skeleton", "sword", "snake", "stable", "smith", "sorcerer",
	"tea", "thief", "thatching", "tiara", "tide", "toad", "track",
	"uniform", "uncle", "uproar", "urchin", "utopia",
	"vagabond", "vacancy", "veal", "veil", "vial", "vice", "void", "vulture",
	"war", "weapon", "wagon", "wizard", "whale", "wife", "wilderness", "wolf", "wraith", "wyvern", "wrath",
	"yew", "yarn", "yoke", "yarrow", "yak",
	"zircon", "zest"
];

export const IDAdjectives = [
	"red", "orange", "yellow", "green", "cyan", "blue", "indigo", "violet", "purple", "black", "gray", "white", "brown",
	"fast", "slow", "quick", "sluggish", "brisk",
	"fat", "skinny", "thin", "wide",
	"happy", "sad", "angry", "mad", "joyful", "merry", "sleepy", "aroused", "confused", "suffering",
	"zinc", "iron", "copper", "brass", "steel", "bronze",
	"useful", "worthless",
	"malicious", "evil", "dark", "menacing",
	"benign", "good", "light", "inviting"
];

export const IDPatterns = [
	[IDAdjectives,IDNouns],
	[IDAdjectives,IDNouns,"And",IDNouns],
	[IDAdjectives,IDNouns,"And",IDAdjectives,IDNouns],
	[IDAdjectives,IDAdjectives,IDNouns]
];

export default function genID(){
	let pattern = IDPatterns[Math.floor(Math.random() * IDPatterns.length)];
	
	let id = "";
	
	for(let i = 0; i < pattern.length; i++){
		if(typeof(pattern[i]) == "string"){
			id += pattern[i];
			continue;
		}
		let word = pattern[i][Math.floor(Math.random() * pattern[i].length)];
		id += word[0].toUpperCase() + word.slice(1);
	}
	
	return id;
};
