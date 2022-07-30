import {DungeonState, safeMerge, State} from './State'
import {$chance} from '../random/chance'
import {isString, slugify} from '@snickbit/utilities'
import Chance from 'chance'

export interface RandomState {
	rng?: Chance.Chance
	seed?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Random extends State {}

const default_state: RandomState = {}

export class Random {
	get seed(): any {
		return this.state.seed
	}

	set seed(seed: any) {
		if (!/[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+/.test(String(seed))) {
			if (isString(seed)) {
				seed = slugify(seed)
			} else {
				// if seed is not a string, generate a string seed
				const seedChance = $chance.clone(seed)
				seed = seedChance.generateSlug()
			}
		}
		this.state.seed = seed
	}

	get rng(): Chance.Chance {
		if (!this.state.rng) {
			this.state.rng = $chance.clone(this.seed)
		}

		return this.state.rng
	}

	set rng(rng: Chance.Chance) {
		this.state.rng = rng
	}

	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
	}

	protected randBetween(min: number, max: number): number {
		return this.rng.integer({min, max})
	}

	protected oneIn(num: number): boolean {
		return this.randBetween(1, num) === 1
	}
}
