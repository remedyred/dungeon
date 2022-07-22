import {generateSlug} from 'random-word-slugs'
import {Out} from '@snickbit/out'
import Chance from 'chance'

export interface ChanceMixins {
	generateSlug: typeof generateSlug
}

export type Chance = Chance.Chance & ChanceMixins

export const $chance = new Chance() as Chance

$chance.mixin({generateSlug})

export const $out = new Out('dungeon')
