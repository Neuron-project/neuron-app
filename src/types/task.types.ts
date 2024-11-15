export interface ITask {
	id?: string
	reward: number | null
	budget: number | null
	title: string
	link: string
	population: number
	completed: number
	botName: string;
}

export interface ITaskCreateDTO extends Omit<ITask, 'completed' | 'id'> {}

export interface ITaskCheckSubscriptionDTO {
	telegramId: string
	channelId: string
}
