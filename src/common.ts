import {generateSlug} from 'random-word-slugs'
import Chance from 'chance'

export interface ChanceMixins {
	generateSlug: typeof generateSlug
}

export type Chance = Chance.Chance & ChanceMixins

export const $chance = new Chance() as Chance

$chance.mixin({generateSlug})
