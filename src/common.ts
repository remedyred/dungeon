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

export const defaultDungeonOptions: DungeonOptions = {
	doorChance: 50,
	maxDoors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50,
	minCorridorLength: 2,
	maxMazeTries: 50,
	mazeCorridors: true
}

