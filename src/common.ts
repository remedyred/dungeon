import {Out} from '@snickbit/out'
import {CorridorStrategy} from './mixins'

export const $out = new Out('dungeon')

export interface ParsedDungeonOptions {
	// Primary stage options
	width: number
	height: number
	seed: string

	// Generator options
	doorChance: number
	maxDoors: number
	roomTries: number
	roomExtraSize?: number
	corridorStrategy: CorridorStrategy[]
	maxMazeTries: number
	minCorridorLength: number
	windingPercent: number

	// Optional
	multiplier?: number
	removeDeadEnds?: boolean
}

export interface DungeonOptions extends Partial<Omit<ParsedDungeonOptions, 'corridorStrategy'>> {
	corridorStrategy: CorridorStrategy | CorridorStrategy[]
}

export const defaultDungeonOptions: Omit<ParsedDungeonOptions, 'seed'> = {
	width: 10,
	height: 10,
	doorChance: 50,
	maxDoors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50,
	minCorridorLength: 2,
	maxMazeTries: 50,
	corridorStrategy: ['prim']
}

