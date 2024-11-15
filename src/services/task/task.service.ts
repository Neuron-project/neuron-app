import { get, ref, update } from 'firebase/database'
import { v4 } from 'uuid'

import {
	ITask,
	ITaskCheckSubscriptionDTO,
	ITaskCreateDTO
} from '@/types/task.types'

import { apiTelegramBot } from '@/api/api'

import { telegramId } from '@/consts/consts'
import { database } from '@/database/firebase'

export const TaskService = {
	getAll: async () => {
		const tasksRef = ref(database, 'tasks')

		const tasks: ITask[] = Object.values((await get(tasksRef)).val())

		return tasks
	},

	deployTask: async (task: ITaskCreateDTO) => {
		const uniqueId = v4()

		
		const tasksRef = ref(database, 'tasks')

		return await update(tasksRef, {
			[uniqueId]: {
				id: uniqueId,
				deployerId: telegramId,
				title: task.title,
				budget: task.budget,
				reward: task.reward,
				population: task.population,
				link: task.link, // Сохраняем полную ссылку
				botName: task.botName, // Используем переданное botName
				completed: 0
			}
		})
	},

	checkBotAdmin: async (channelId: string): Promise<boolean> => {
		const { data } = await apiTelegramBot.post('/api/check-bot-admin', {
			channelId
		})

		return data.isAdmin
	},

	checkSubscription: async (body: ITaskCheckSubscriptionDTO) => {
		const { data } = await apiTelegramBot.post('/check-subscription', {
			telegramId: body.telegramId,
			channelId: body.channelId
		})
		return data.isSubscribed
	},

	complete: async (id: string) => {
		const taskRef = ref(database, `tasks/${id}`)
		const task: ITask = (await get(taskRef)).val()

		return await update(taskRef, {
			completed: task.completed + 1
		})
	}
}
