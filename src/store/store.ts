import { create } from 'zustand'

interface IPointsStore {
	points: number
	increasePoints: (coefficient: number) => void
	setPoints: (points: number) => void
}

interface ITimerStore {
	timer: number
	decreaseTimer: () => void
	setTimer: (value: number) => void
}

interface IIntervalStore {
	intervalId: NodeJS.Timeout | null
	setIntervalId: (value: NodeJS.Timeout) => void
}

interface IForceUpdate {
	forceUpdate: number
	setForceUpdate: () => void
}

export const usePointsStore = create<IPointsStore>(set => ({
	points: 0,
	setPoints: points => set(() => ({ points })),
	increasePoints: coefficient =>
		set(({ points }) => ({ points: points + coefficient }))
}))

export const useTimerStore = create<ITimerStore>(set => ({
	timer: 0,
	decreaseTimer: () => set(({ timer }) => ({ timer: timer - 1 })),
	setTimer: value => set(() => ({ timer: value }))
}))

export const useIntervalStore = create<IIntervalStore>(set => ({
	intervalId: null,
	setIntervalId: value => set(() => ({ intervalId: value }))
}))
export const useForceUpdate = create<IForceUpdate>(set => ({
	forceUpdate: 0,
	setForceUpdate: () =>
		set(({ forceUpdate }) => ({ forceUpdate: forceUpdate + 1 }))
}))
