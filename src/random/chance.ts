import {generateSlug} from 'random-word-slugs'

import Chance from 'chance'

export interface ChanceMixins {
	generateSlug: typeof generateSlug
	clone: typeof makeChance
}

export type Chance = Chance.Chance & ChanceMixins

function makeChance(seed?: any): Chance {
	const $chance = new Chance(seed)
	$chance.mixin({generateSlug, clone: makeChance})
	return $chance as Chance
}

export const $chance = makeChance()
