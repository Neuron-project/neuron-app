import { useQuery } from '@tanstack/react-query'
import { fromNano } from '@ton/core'
import { type FC } from 'react'

import Button from '@/components/shared/button/Button'

import { TonService } from '@/services/ton/ton.service'

import tonImage from '@/assets/images/ton.png'

import { useWallet } from '@/hooks/useWallet'

import styles from './BuyNft.module.scss'
import { useBuyNft } from './useBuyNft'

const BuyNft: FC = () => {
	const { randomImage, buyNft } = useBuyNft()
	const { connected, wallet } = useWallet()
	const { data: balance } = useQuery({
		queryKey: ['get-balance'],
		queryFn: () => TonService.getBalance(wallet!),
		enabled: !!wallet
	})

	return (
		<div className={styles.wrapper}>
			<img src={randomImage} alt='' />
			<p>
				PRICE: 7 <img className='w-7 h-7' src={tonImage} alt='' />
			</p>
			<Button
				disabled={!connected || (balance && Number(fromNano(balance)) < 7)}
				onClick={buyNft}
			>
				buy
			</Button>
		</div>
	)
}

export default BuyNft
