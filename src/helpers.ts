import Chance from 'chance'
import Victor from 'victor'

export const nameChance = new Chance()

const n = new Victor(0, 1)
const e = new Victor(1, 0)
const s = new Victor(0, -1)
const w = new Victor(-1, 0)

// The four cardinal directions: north, south, east, and west.
export const cardinalDirections = [
	n,
	e,
	s,
	w
]

export const defaultDungeonOptions = {
	extraConnectorChance: 50,
	maxConnectors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50
}

export const defaultStageOptions = {
	width: 5,
	height: 5,
	seed: nameChance.guid()
}
