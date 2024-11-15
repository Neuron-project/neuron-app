import { useMutation, useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { type FC, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import Loader from '@/components/shared/loader/Loader'

import { TaskService } from '@/services/task/task.service'
import { UserService } from '@/services/user/user.service'

import np from '@/assets/images/home/neuron-points.svg'

import { ITaskCheckSubscriptionDTO } from '@/types/task.types'
import { IUser } from '@/types/user.types'

import styles from './Task.module.scss'
import { ITaskProps } from './task.types'
import { telegramId } from '@/consts/consts'
import { usePointsStore } from '@/store/store'
import { sleep } from '@/utils/sleep.utils'

const Task: FC<ITaskProps> = ({
	title,
	reward,
	population,
	completed,
	setTasks,
	isCompleted,
	link,
	id,
	botName // Передаем botName как пропс
}) => {
	const [isCheckMark, setIsCheckMark] = useState(false)
	const [isVisited, setIsVisited] = useState(false)
	const isBotTask = link.endsWith('bot') // Определяем задачу на бота
	const isRefOpen = link.includes('start') || link.includes('startapp') // Пояснение: реферальная задача

	const { data: user } = useQuery({
		queryKey: ['get-user'],
		queryFn: () => UserService.getUserFields<IUser>(telegramId)
	})

	useEffect(() => {
		if (user && user.completedTasks) {
			const completedTasks = user.completedTasks // Массив всех выполненных задач

			// Для каждой задачи из базы данных проверяем, выполнена ли она
			const taskAlreadyCompleted = completedTasks.some((task: string) => {
				// Проверяем, совпадает ли link или botName с элементом в completedTasks
				return (
					task === link || task === botName // Сравниваем ссылку и имя бота
				)
			})

			if (taskAlreadyCompleted) {
				setIsCheckMark(true) // Если задача найдена среди выполненных — ставим галочку
			}
		}
	}, [user, link, botName])

	const {
		data: subscription,
		isPending: isPendingCheckSubscription,
		mutate: mutateCheckSubscription
	} = useMutation({
		mutationKey: ['check-subscription', id],
		mutationFn: (data: ITaskCheckSubscriptionDTO) =>
			TaskService.checkSubscription(data)
	})

	// Обработка выполнения задачи при изменении состояния подписки
	useEffect(() => {
		if (isCheckMark || isRefOpen || isBotTask) return // Задача уже выполнена или реферальная задача

		if (subscription === true) {
			completeTask()
		} else if (subscription === false) {
			toast.error("You haven't subscribed to the channel, try again")
		}
	}, [subscription])

	const handlerClickTask = async () => {
		console.log('Handler clicked for task', { isBotTask, link }) // Добавьте этот лог

		let formattedLink = link

		// Проверяем, если это реферальная ссылка
		if (link.includes('start') || link.includes('startapp')) {
			// Это реферальная ссылка, оставляем как есть
			// Проверим, не начинается ли уже ссылка с https://t.me/
			if (!link.startsWith('https://t.me/')) {
				formattedLink = `https://t.me/${link}` // Если нет, добавляем префикс
			}
		} else if (link.startsWith('@')) {
			// Это обычная ссылка на канал/бота
			formattedLink = `https://t.me/${link.substring(1)}` // Убираем @ и добавляем https://t.me/
		}

		// Логируем, что именно будет открыто
		console.log('Formatted link to open:', formattedLink)

		// Открываем ссылку
		window.open(formattedLink, '_blank')
		await sleep(500)
		setIsVisited(true)

		if (isBotTask) {
			console.log('Bot task detected, completing task immediately') // Лог для отслеживания
			completeTask() // Зачисляем награду сразу для задачи на бота
		}
		if (isRefOpen) {
			console.log('Referral task detected, completing task immediately')
			completeTask() // Зачисляем награду сразу
		}
	}

	const completeTask = () => {
		console.log('Completing task:', { id, link, reward, botName }) // Логируем все параметры задачи

		UserService.completeTask(telegramId, link, botName) // Передаем все необходимые аргументы: telegramId, link и botName

		setIsCheckMark(true)
		toast.success("You've successfully completed the task")

		const currentPoints = usePointsStore.getState().points
		const newPoints = currentPoints + reward!
		console.log('Updated points:', newPoints)
		UserService.updatePoints(telegramId, newPoints)
		UserService.awardPointsToUser(telegramId, reward!)
		// Завершаем задачу на сервере
		TaskService.complete(id!)

		// Обновляем состояние задач
		setTasks(tasks =>
			tasks.map(t =>
				t.link === link
					? { ...t, isCompleted: true, completed: t.completed + 1 }
					: t
			)
		)
		console.log('Task completed and state updated')
	}

	const handleUserReturn = async () => {
		// Только для заданий на подписку на канал
		if (!isBotTask) {
			mutateCheckSubscription({
				telegramId: telegramId,
				channelId: link
			})
		}
		setIsVisited(false)
	}

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && isVisited) {
				handleUserReturn()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [isVisited])

	const renderButtonState = () => {
		if (isCheckMark || isCompleted) {
			return <Check className={styles.check} size={18} />
		}
		if (isPendingCheckSubscription) {
			return <Loader isBlack />
		}
		return <img src={np} alt='' />
	}
	const extractUsernameFromLink = (link: string) => {
		// Регулярное выражение для извлечения юзернейма
		const match = link.match(/(?:https?:\/\/(?:www\.)?t\.me\/|@)([\w\d_]+)/)
		if (match) {
			return `@${match[1]}` // Добавляем @ перед юзернеймом
		}
		return link // Если это не реферальная ссылка, возвращаем саму ссылку
	}

	return (
		<div
			className={`${styles.task} ${isRefOpen ? styles.referralBackground : ''}`}
		>
			<div>
				<h1>
					{title}
					<span>{extractUsernameFromLink(link)}</span>
				</h1>
				<div>
					<p>{reward} NP</p>
					<span>
						{completed}/{population}
					</span>
				</div>
			</div>
			<button
				disabled={isPendingCheckSubscription || isCheckMark || isCompleted}
				onClick={handlerClickTask}
			>
				{renderButtonState()}
			</button>
		</div>
	)
}

export default Task
