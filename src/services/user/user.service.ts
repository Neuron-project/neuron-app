import { Address } from '@ton/ton'
import { get, ref, update } from 'firebase/database'
import { v4 } from 'uuid'

import { apiTelegramBot } from '@/api/api'

import { BUY_NP, telegramId } from '@/consts/consts'
import { database } from '@/database/firebase'

export const UserService = {
	getUserFields: async <T>(telegramUserId: string, fieldArg: string = '') => {
		const fieldRef = ref(database, `users/${telegramUserId}/${fieldArg}`)

		const field: T = (await get(fieldRef)).val()

		return field
	},

	addTransactionBuy: async (wallet: string) => {
		const uniqueId = v4()
		const userMarketRef = ref(database, `market/buy/${telegramId}`)

		await update(userMarketRef, {
			[uniqueId]: {
				timestamp: new Date().toLocaleString(),
				wallet: `${Address.parse(wallet!).toString({
					bounceable: false
				})}`,
				points: BUY_NP
			}
		})
	},

	addTransactionSell: async (wallet: string) => {
		const uniqueId = v4()
		const userMarketRef = ref(database, `market/sell/${telegramId}`)

		await update(userMarketRef, {
			[uniqueId]: {
				timestamp: new Date().toLocaleString(),
				wallet: `${Address.parse(wallet!).toString({
					bounceable: false
				})}`,
				points: BUY_NP
			}
		})
	},

	setIsHadNft: async (telegramUserId: string, value: boolean) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			isHadNft: value
		})
	},

	setAddressWallet: async (telegramUserId: string, addressWallet: string) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			addressWallet
		})
	},

	updatePoints: async (telegramUserId: string, points: number) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			points
		})
	},

	verifyEndTimer: async (telegramUserId: string) => {
		const { data } = await apiTelegramBot.post('/api/verify-timer', {
			telegramId: telegramUserId
		})

		return data
	},

	startTimer: async (telegramUserId: string) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			startTimer: Date.now(),
			countDownTime: Date.now()
		})
	},

	resetStartTimer: async (telegramUserId: string) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			startTimer: 0,
			countDownTime: 0
		})
	},
	setCountDownTimer: async (telegramUserId: string) => {
		const userRef = ref(database, `users/${telegramUserId}`)

		await update(userRef, {
			countDownTime: Date.now()
		})
	},

	awardPointsToUser: async (telegramUserId: string, points: number) => {
		return await apiTelegramBot.post('/api/award-points', {
			telegramId: telegramUserId,
			points
		})
	},

	completeTask: async (
		telegramUserId: string,
		link: string,
		botName: string
	) => {
		const userCompletedTasksRef = ref(
			database,
			`users/${telegramUserId}/completedTasks`
		)

		const tasks =
			(await get(userCompletedTasksRef)).val() !== null || undefined
				? Object.values((await get(userCompletedTasksRef)).val())
				: []

		// Добавляем новую задачу только если её ещё нет в списке
		if (!tasks.includes(link)) {
			tasks.push(link)
		}

		// Добавляем botName, если он не пустой
		if (botName && !tasks.includes(botName)) {
			tasks.push(botName)
		}

		await update(userCompletedTasksRef, {
			...tasks
		})
	},
	getTotalReferralPoints: async (telegramUserId: string) => {
		try {
			const pointsRef = ref(
				database,
				`users/${telegramUserId}/totalReferralPoints`
			)
			const pointsSnapshot = await get(pointsRef)
			const points = pointsSnapshot.val()
			return typeof points === 'number' ? points : 0
		} catch (error) {
			console.error('Error fetching totalReferralPoints:', error)
			return 0 // Верните значение по умолчанию в случае ошибки
		}
	}
}
