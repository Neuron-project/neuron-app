import { useMutation } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import Field from '@/components/shared/field/Field'
import Select from '@/components/shared/select/Select'

import { TaskService } from '@/services/task/task.service'
import { UserService } from '@/services/user/user.service'

import { queryClient } from '@/providers/tanstack/TanstackProvider'

import { ITaskCreateDTO } from '@/types/task.types'

import { budgetData, rewardsData } from './creation-task.data'
import { telegramId } from '@/consts/consts'
import { usePointsStore } from '@/store/store'
import { sleep } from '@/utils/sleep.utils'

export const useCreationTask = () => {
	const [isCreation, setIsCreation] = useState(false)
	const { setPoints } = usePointsStore(state => state)
	const [link, setLink] = useState('')
	const [isBotTask, setIsBotTask] = useState(false)
	const [isRefOpen, setIsRefOpen] = useState(false)

	const [step, setStep] = useState(1)

	const {
		register,
		setValue,
		getValues,
		watch,
		formState: { errors },
		handleSubmit,
		control
	} = useForm<ITaskCreateDTO>({
		mode: 'onChange'
	})

	const [budget, reward] = watch(['budget', 'reward'])

	useEffect(() => {
		if (budget && reward) {
			setValue('population', budget / reward)
		} else {
			setValue('population', 0)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [budget, reward])

	const { mutate: mutateVerify, isPending: isPendingVerification } =
		useMutation({
			mutationKey: ['bot-verify'],
			mutationFn: (channelId: string) => TaskService.checkBotAdmin(channelId),
			onSuccess: () => {
				toast.success('You have successfully passed the verification')
				setStep(3)
			},
			onError: () => {
				toast.error('You have not passed the verification')
			}
		})

	const { mutate: mutateDeploy, isPending: isPendingDeploy } = useMutation({
		mutationKey: ['deploy-task'],
		mutationFn: (task: ITaskCreateDTO) => TaskService.deployTask(task),
		onSuccess: async () => {
			toast.success("You've deployed the task")
			queryClient.invalidateQueries({ queryKey: ['get-tasks'] })

			UserService.updatePoints(
				telegramId,
				usePointsStore.getState().points - getValues('budget')!
			)
			setPoints(usePointsStore.getState().points - getValues('budget')!)
			setIsCreation(false)
			await sleep(1000)
			setStep(1)
			setValue('title', '')
			setLink('')
			setValue('link', '')
			setValue('budget', null)
			setValue('reward', null)
			setIsBotTask(false) // Сброс состояния задачи на бота после развертывания
		},
		onError: () => {
			toast.error('Ошибка, попробуйте снова')
		}
	})

	const isPending = isPendingDeploy || isPendingVerification

	const handleChangeLink = (e: ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value

		// Проверка на пустое значение
		if (value.length === 0) {
			setLink('')
			setValue('link', '')
			setIsBotTask(false)
			return
		}

		// Обработка ссылки для задачи по кнопке "REF"
		if (isRefOpen) {
			const value = e.target.value.trim() // Получаем ссылку из поля ввода

			setLink(value)
			setValue('link', value)

			// Проверка, что реферальная ссылка содержит "start" или "startapp"
			if (value.includes('start') || value.includes('startapp')) {
				// Извлекаем юзернейм из реферальной ссылки
				const username = value.split('/')[1] // Это будет имя после "t.me/" или аналогичной части

				if (username) {
					setLink(`@${username}`) // Сохраняем только юзернейм в линк
					setValue('link', `@${username}`) // Обновляем значение в форме

					setIsBotTask(true) // Устанавливаем задачу на бота
				}
			} else {
				setIsBotTask(false) // Если не задача на бота, сбрасываем
			}

			return
		}

		// Обработка ссылки для обычной задачи по кнопке "Плюс/Минус"
		// Если ссылка начинается с "t.me/", извлекаем юзернейм и добавляем "@" в начале
		if (value.startsWith('t.me/')) {
			const username = value.split('t.me/')[1]
			if (username) {
				setLink(`@${username}`)
				setValue('link', `@${username}`)
				setIsBotTask(false)
				// Устанавливаем botName для обычной задачи
				setValue('botName', `@${username}`)
			}
			return
		}

		// Добавляем "@" для остальных ссылок, если отсутствует префикс
		if (!value.startsWith('@')) {
			value = '@' + value
		}

		// Проверка на задачи с ботами для обычной ссылки
		if (value.includes('start') || value.includes('startapp')) {
			const botUsername = value.split('/').slice(3, 4)[0]
			setLink(`@${botUsername}`)
			setValue('link', `@${botUsername}`)
			setIsBotTask(true)
			// Устанавливаем botName для задачи на бота
			setValue('botName', `@${botUsername}`);

		} else if (value.endsWith('bot')) {
			setLink(value.trim())
			setValue('link', value.trim())
			// Устанавливаем botName для задачи на бота
			setValue('botName', value.trim());
			setIsBotTask(true)

		} else {
			setLink(value.trim())
			setValue('link', value.trim())
			// Устанавливаем botName для канала
			setValue('botName', value.trim());
			setIsBotTask(false)
		}

		console.log('Updated link:', value.trim()) // Логирование
	}

	const handlerCopyBot = async () => {
		await navigator.clipboard.writeText('@neuron_admin_bot')
		toast.success('Copied!')
	}

	const renderSteps = () => {
		switch (step) {
			case 1: {
				return (
					<Field
						value={link}
						placeholder={
							isRefOpen
								? 'https://t.me/your_bot_username'
								: '@task_channel or @bot'
						}
						type='text'
						{...register('link', { required: true })}
						onChange={handleChangeLink}
					/>
				)
			}
			case 2: {
				return isBotTask ? null : '' // Пропустить, если задача на бота
			}
			case 3: {
				return (
					<div className='flex flex-col gap-y-4'>
						<Field
							className={`${errors.title && '!border-red-500'}`}
							placeholder='Title (maximum 34 characters)'
							type='text'
							{...register('title', {
								required: true,
								pattern: {
									value: /^.{0,34}$/,
									message: 'maximum 34 characters'
								}
							})}
						/>
						<Select
							control={control}
							name='budget'
							placeholder='NP Budget'
							options={budgetData}
						/>
						<Select
							control={control}
							name='reward'
							placeholder='NP Reward'
							options={rewardsData}
						/>
						<div className='px-[3px] flex items-center justify-between'>
							<div className='flex items-center gap-x-2'>
								<Users />
								<p>Number of subscribers:</p>
							</div>
							<span>{watch('population')}</span>
						</div>
					</div>
				)
			}
		}
	}

	const renderTextButtonStep = () => {
		switch (step) {
			case 1: {
				return 'Enter'
			}
			case 2: {
				return isBotTask ? 'Creat task' : 'Verify'
			}
			case 3: {
				return 'Deploy'
			}
		}
	}

	const renderStepTitle = () => {
		switch (step) {
			case 1:
				return isRefOpen
					? 'Add referral link to bot'
					: 'Add link to task bot or channel' // Заголовок для шага 1
			case 2: {
				return !isBotTask ? (
					<>
						Add{' '}
						<span onClick={handlerCopyBot} className='font-bold cursor-pointer'>
							@neuron_admin_bot
						</span>{' '}
						to task channel with admin role
					</>
				) : (
					'Verify your link'
				)
			}
			case 3: {
				return 'Create your task'
			}
		}
	}
	return {
		register,
		setLink,
		isCreation,
		setIsCreation,
		setIsRefOpen, // Возвращаем setIsRefOpen, чтобы менять это состояние
		isRefOpen, // Возвращаем состояние isRefOpen, чтобы использовать его в компоненте
		handleSubmit, // Подключаем обработчик к форме
		mutateDeploy,
		mutateVerify,
		step,
		setStep,
		renderStepTitle,
		renderSteps,
		renderTextButtonStep,
		handlerCopyBot, // Возвращаем обработчик копирования
		setIsBotTask, // Возвращаем функцию для изменения состояния задачи на бота
		isPending,
		isBotTask
	}
}
