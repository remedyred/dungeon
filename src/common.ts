import {Out} from '@snickbit/out'

export const $out = new Out('dungeon')

export interface DungeonOptions {
	doorChance?: number
	maxDoors?: number
	roomTries?: number
	roomExtraSize?: number
	mazeCorridors?: boolean
	maxMazeTries?: number
	minCorridorLength?: number
	windingPercent?: number
	multiplier?: number
	width?: number
	height?: number
	removeDeadEnds?: boolean
}

// todo: remove stage options and merge them with dungeon options.
export interface StageOptions {
	width: number
	height: number
	seed?: any
}

export const defaultDungeonOptions: DungeonOptions = {
	doorChance: 50,
	maxDoors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50,
	minCorridorLength: 2,
	maxMazeTries: 500,
	mazeCorridors: true
}

export const defaultStageOptions: StageOptions = {
	width: 5,
	height: 5
}
