import { type FC } from 'react'

import Face2 from '@/assets/images/home/face2.png'
import Face from '@/assets/images/home/face.png'
import LeftArm from '@/assets/images/home/left hand.png'
import RightArm from '@/assets/images/home/right hand.png'

import styles from './Clicker.module.scss'
import { useClicker } from './useClicker'
import { telegramId } from '@/consts/consts'

const Clicker: FC = () => {
	const { user, mutate } = useClicker()

	return (
		<div className={styles.clicker}>
			<div>
				<img
					onClick={() => {
						if (!user?.timer.isProcessing) {
							mutate(telegramId)
						}
					}}
					src={!!user?.timer ? (user.timer.isProcessing ? Face2 : Face) : Face}
					alt='Face'
				/>
				<img src={LeftArm} alt='Left Arm' />
				<img src={RightArm} alt='Right Arm' />
			</div>
		</div>
	)
}

export default Clicker
