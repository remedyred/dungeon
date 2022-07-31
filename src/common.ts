import {Out} from '@snickbit/out'
import {CorridorStrategy} from './mixins'

export const $out = new Out('dungeon')

export interface DungeonOptions {
	doorChance?: number
	maxDoors?: number
	roomTries?: number
	roomExtraSize?: number
	corridorStrategy: CorridorStrategy | CorridorStrategy[]
	maxMazeTries?: number
	minCorridorLength?: number
	windingPercent?: number
	multiplier?: number
	width?: number
	height?: number
	removeDeadEnds?: boolean
}

export interface ParsedDungeonOptions extends DungeonOptions {
	corridorStrategy: CorridorStrategy[]
}

export const defaultDungeonOptions: DungeonOptions = {
	doorChance: 50,
	maxDoors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50,
	minCorridorLength: 2,
	maxMazeTries: 50,
	corridorStrategy: 'prim'
}

