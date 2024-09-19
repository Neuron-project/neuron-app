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
import { sleep } from '@/utils/sleep.utils'

const Task: FC<ITaskProps> = ({
	title,
	reward,
	population,
	completed,
	setTasks,
	link,
	id
}) => {
	const [isAnimatedCheckMark, setIsAnimatedCheckMark] = useState(false)
	const { data: user } = useQuery({
		queryKey: ['get-user'],
		queryFn: () => UserService.getUserFields<IUser>(telegramId)
	})

	const [isVisited, setIsVisited] = useState(false)
	const {
		data: subscription,
		isPending: isPendingCheckSubscription,
		mutate: mutateCheckSubscription
	} = useMutation({
		mutationKey: ['check-subscription', id],
		mutationFn: (data: ITaskCheckSubscriptionDTO) =>
			TaskService.checkSubscription(data)
	})

	const { mutate: awardPointsToUser } = useMutation({
		mutationFn: (points: number) => UserService.awardPointsToUser(telegramId, points),
		onSuccess: () => {
			toast.success('Points awarded successfully!')
		},
		onError: () => {
			toast.error('Failed to award points.')
		}
	})

	useEffect(() => {
		const check = async () => {
			switch (subscription) {
				case true: {
					toast.success("You've successfully completed the task")
					UserService.completeTask(telegramId, link)
					UserService.updatePoints(telegramId, user!.points + reward!)
					awardPointsToUser(reward!)
					TaskService.complete(id)
					setIsAnimatedCheckMark(true)
					await sleep(500)
					setTasks(prev => prev.filter(t => t.link !== link))
					break
				}
				case false: {
					toast.error("You haven't subscribed to the channel, try again")
				}
			}
		}
		check()
	}, [subscription])

	const handlerClickTask = async () => {
		window.open(`https://t.me/${link.substring(1)}`, '_blank')

		await sleep(500)

		setIsVisited(true)
	}

	const handleUserReturn = async () => {
		mutateCheckSubscription({
			telegramId: telegramId,
			channelId: link
		})
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
		if (isAnimatedCheckMark) {
			return <Check className={styles.check} size={18} />
		}
		if (isPendingCheckSubscription) {
			return <Loader isBlack />
		}
		return <img src={np} alt='' />
	}

	return (
		<div className={styles.task}>
			<div>
				<h1>
					{title}
					<span>{link}</span>
				</h1>
				<div>
					<p>{reward} NP</p>
					<span>
						{completed}/{population}
					</span>
				</div>
			</div>
			<button
				disabled={isPendingCheckSubscription || isAnimatedCheckMark}
				onClick={handlerClickTask}
			>
				{renderButtonState()}
			</button>
		</div>
	)
}

export default Task