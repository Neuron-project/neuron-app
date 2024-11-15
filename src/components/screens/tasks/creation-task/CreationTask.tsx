import cn from 'clsx'
import { CircleArrowLeft, CircleMinus, CirclePlus } from 'lucide-react'
import { type FC, useEffect } from 'react'
import { SubmitHandler } from 'react-hook-form'
import toast from 'react-hot-toast'

import Button from '@/components/shared/button/Button'
import Loader from '@/components/shared/loader/Loader'

import { ITaskCreateDTO } from '@/types/task.types'

import styles from './CreationTask.module.scss'
import { useCreationTask } from './useCreationTask'

const CreationTask: FC = () => {
	const {
		isCreation,
		setIsCreation,
		setIsRefOpen,
		isRefOpen,
		setLink,
		handleSubmit,
		mutateDeploy,
		mutateVerify,
		step,
		setStep,
		renderStepTitle,
		renderSteps,
		renderTextButtonStep,
		isPending,
		setIsBotTask,
		isBotTask
	} = useCreationTask()

	// Логирование для отслеживания изменений в step
	useEffect(() => {
		console.log('Step updated:', step) // Логирование после обновления step
	}, [step])

	useEffect(() => {
		// Этот useEffect будет сбрасывать шаг, если форма закрывается
		if (!isCreation) {
			setStep(1) // Сброс шага на 1
			setLink('') // Очистка ссылки
			setIsBotTask(false) // Сброс состояния задачи на бота
			setIsRefOpen(false) // Сброс состояния "REF" при закрытии формы
		}
	}, [isCreation, setStep, setLink, setIsBotTask, setIsRefOpen])

	const submitHandler: SubmitHandler<ITaskCreateDTO> = async data => {
		if (isPending) return

		const link = data.link.trim()
		let botName = data.botName // Возьмем значение из формы, если оно есть
		console.log('Submitting data:', data)
		console.log('Step 1: Link is', link)

		// Обработка для кнопки "REF" - проверка только реферальных ссылок
		if (isRefOpen) {
			console.log('Link before validation:', link)
			if (link.includes('start') || link.includes('startapp')) {
				console.log('Referral link is valid:', link)
				setIsBotTask(true)

				// Извлекаем имя бота
				const extractBotName = link.split('t.me/')[1].split('/')[0]

				// Присваиваем правильное имя бота с '@'
				botName = `@${extractBotName}`

				console.log('Extracted bot name:', botName) // Для проверки

				setStep(3) // Переход к деплою
				await new Promise(resolve => setTimeout(resolve, 0))
				console.log('Referral task set to step 3, current step:', step)
			} else {
				toast.error('The referral link must contain “start” or “startapp"')
				console.error('Invalid referral link:', link)
				return
			}
		}

		// Обработка для обычных задач по кнопке "Плюс/Минус"
		if (!isRefOpen) {
			// Если ссылка начинается с "@", значит это канал
			if (link.startsWith('@') && link.endsWith('bot')) {
				setIsBotTask(true)
				botName = `@${link.slice(1)}` // Извлекаем имя бота из ссылки
				if (step !== 3) setStep(3) // Шаг 3 для бота
				console.log('Setting step to 3 for bot, current step:', step)
			}

			// Если ссылка начинается с "@", но не заканчивается на "bot", значит это обычный канал
			else if (link.startsWith('@')) {
				setIsBotTask(false)
				botName = `@${link.slice(1)}`
				if (step !== 2) setStep(2) // Шаг 2 для канала
				console.log('Setting step to 2 for channel, current step:', step)
			}

			// Если ссылка заканчивается на "bot" (но не начинается с "@"), значит это задача на бота
			else if (link.endsWith('bot')) {
				setIsBotTask(true)
				botName = `@${link}` // Юзернейм для бота
				if (step !== 3) setStep(3) // Шаг 3 для бота
				console.log('Setting step to 3 for bot, current step:', step)
			} else {
				// Если ссылка не соответствует формату канала или бота
				toast.error('Please enter the correct bot or channel link')
				console.error('Invalid link format:', link)
				return
			}
		}
		// Отслеживание изменений шага

		console.log('Current step before switch:', step)
		switch (step) {
			case 2: {
				console.log('Step 2: Verifying link', link)
				await mutateVerify(data.link)
				break
			}
			case 3: {
				console.log('Step 3: Deploying task with data:', {
					title: data.title,
					budget: data.budget,
					reward: data.reward,
					population: data.budget! / data.reward!,
					link: data.link,
					botName: botName // Передаем botName
				})
				try {
					const response = await mutateDeploy({
						title: data.title,
						budget: data.budget,
						reward: data.reward,
						population: data.budget! / data.reward!,
						link: data.link,
						botName: botName // Передаем botName в деплой
					})
					console.log('Task deployment completed successfully:', response)
				} catch (error) {
					console.error('Error deploying task:', error)
					toast.error('Error deploying task')
				}
				break
			}
			default:
				console.log('Invalid step:', step)
				break
		}
	}
	// Хук useEffect для отслеживания изменений шага
	useEffect(() => {
		console.log('Step has changed:', step)
	}, [step]) // Отслеживаем изменения step

	return (
		<div className={styles.creation}>
			<div className={styles.buttonСontainer}>
				{/* Кнопка REF слева */}
				<button
					className={styles.btnReferral}
					onClick={() => {
						// Переключаем состояние isCreation
						if (isCreation) {
							setIsCreation(false) // Закрыть форму
							setIsRefOpen(false) // Скрыть форму с реферальной ссылкой
							setStep(1) // Сброс шага
							setLink('') // Очистить ссылку
							setIsBotTask(false) // Сбросить состояние задачи на бота
						} else {
							setIsCreation(true) // Открыть форму
							setIsRefOpen(true) // Открыть форму с реферальной ссылкой
							setStep(1) // Установить начальный шаг
							setLink('') // Очистить ссылку
							setIsBotTask(false) // Сбросить задачу на бота
						}
					}}
				>
					{isCreation ? 'Close' : 'Add Referral Task'}
				</button>

				{/* Кнопка с плюс/минус справа */}
				<button
					className={styles.btnToggle}
					onClick={() => {
						if (!isCreation) {
							setIsCreation(true) // Открыть форму
							setStep(1) // Установить начальный шаг
							setLink('') // Очистить ссылку
							setIsBotTask(false) // Сбросить задачу на бота
						} else {
							setIsCreation(false) // Закрыть форму
						}
					}}
				>
					{isCreation ? (
						<CircleMinus className={styles.icon} />
					) : (
						<CirclePlus className={styles.icon} />
					)}
				</button>
			</div>
			<div className={cn({ [styles.active]: isCreation })}>
				<form onSubmit={handleSubmit(submitHandler)}>
					<div className={cn(styles.head, { [styles.initial]: step === 1 })}>
						{step > 1 && (
							<button
								type='button'
								className='active:scale-95 transition-all'
								onClick={() => setStep(isBotTask && step === 3 ? 1 : step - 1)}
							>
								<CircleArrowLeft />
							</button>
						)}
						<p>Step {step === 3 && isBotTask ? 2 : step}.</p>
					</div>
					<p>{renderStepTitle()}</p>
					{renderSteps()}
					<Button type='submit' className='mt-3'>
						{isPending ? <Loader /> : renderTextButtonStep()}
					</Button>
				</form>
			</div>
		</div>
	)
}

export default CreationTask
