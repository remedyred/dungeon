import {dungeon} from '../../../src'

describe('seeds', () => {
	it('should return a re-usable seed', () => {
		const width = 21
		const height = 21
		const dungeon1 = dungeon().build({
			width,
			height
		})

		const dungeon2 = dungeon().build({
			width,
			height,
			seed: dungeon1.seed
		})

		expect(dungeon1.toJSON()).toStrictEqual(dungeon2.toJSON())
	})

	it('seeded dungeons should be consistent', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})
		expect($dungeon.toJSON()).toMatchSnapshot()
	})

	it('should be seedable', () => {
		const width = 21
		const height = 21
		const dungeon1 = dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})

		const dungeon2 = dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})

		expect(dungeon1.toJSON()).toStrictEqual(dungeon2.toJSON())
	})
})
