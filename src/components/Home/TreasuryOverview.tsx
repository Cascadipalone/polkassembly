// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { CaretDownOutlined, CaretUpOutlined, LoadingOutlined } from '@ant-design/icons';
import type { Balance } from '@polkadot/types/interfaces';
import { BN_MILLION, BN_ZERO, u8aConcat, u8aToHex } from '@polkadot/util';
import { Divider, Progress } from 'antd';
import BN from 'bn.js';
import { dayjs } from 'dayjs-init';
import React, { FC, useEffect, useState } from 'react';
import { subscanApiHeaders } from 'src/global/apiHeaders';
import { chainProperties } from 'src/global/networkConstants';
import HelperTooltip from 'src/ui-components/HelperTooltip';
import blockToDays from 'src/util/blockToDays';
import blockToTime from 'src/util/blockToTime';
import formatBnBalance from 'src/util/formatBnBalance';
import formatUSDWithUnits from 'src/util/formatUSDWithUnits';
import styled from 'styled-components';
import { useApiContext, useNetworkContext } from '~src/context';
import Available from '~assets/icons/available.svg';
import CurrentPrice from '~assets/icons/currentprice.svg';
import NextBurn from '~assets/icons/nextburn.svg';
import SpendPeriod from '~assets/icons/spendperiod.svg';
import getDaysTimeObj from '~src/util/getDaysTimeObj';
import { GetCurrentTokenPrice } from '~src/util/getCurrentTokenPrice';

const EMPTY_U8A_32 = new Uint8Array(32);

interface ITreasuryOverviewProps{
	inTreasuryProposals?: boolean
	className?: string
}

const TreasuryOverview: FC<ITreasuryOverviewProps> = (props) => {
	const { className, inTreasuryProposals } = props;
	const { network } = useNetworkContext();

	const { api, apiReady } = useApiContext();

	const blockTime:number = chainProperties?.[network]?.blockTime;
	const [available, setAvailable] = useState({
		isLoading: true,
		value: '',
		valueUSD: ''
	});
	const [nextBurn, setNextBurn] = useState({
		isLoading: true,
		value: '',
		valueUSD: ''
	});
	const [currentTokenPrice, setCurrentTokenPrice] = useState({
		isLoading: true,
		value: ''
	});
	const [priceWeeklyChange, setPriceWeeklyChange] = useState({
		isLoading: true,
		value: ''
	});
	const [spendPeriod, setSpendPeriod] = useState({
		isLoading: true,
		percentage: 0,
		value: {
			days: 0,
			hours: 0,
			minutes: 0,
			total: 0
		}
	});

	useEffect(() => {
		if (!api || !apiReady) {
			return;
		}

		setSpendPeriod({
			isLoading: true,
			percentage: 0,
			value: {
				days: 0,
				hours: 0,
				minutes: 0,
				total: 0
			}
		});
		api.derive.chain.bestNumber((currentBlock) => {
			const spendPeriodConst = api.consts.treasury
				? api.consts.treasury.spendPeriod
				: BN_ZERO;
			if(spendPeriodConst){
				const spendPeriod = spendPeriodConst.toNumber();
				const totalSpendPeriod: number = blockToDays(spendPeriod, network, blockTime);
				const goneBlocks = currentBlock.toNumber() % spendPeriod;
				// const spendPeriodElapsed: number = blockToDays(goneBlocks, network, blockTime);
				// const spendPeriodRemaining: number = totalSpendPeriod - spendPeriodElapsed;
				const { time } = blockToTime(spendPeriod - goneBlocks, network, blockTime);
				const { d, h, m } = getDaysTimeObj(time);

				const percentage = ((goneBlocks/spendPeriod) * 100).toFixed(0);

				setSpendPeriod({
					isLoading: false,
					// spendPeriodElapsed/totalSpendPeriod for opposite
					percentage: parseFloat(percentage),
					value: {
						days: d,
						hours: h,
						minutes: m,
						total: totalSpendPeriod
					}
				});

			}
		}).catch(() => {
			setSpendPeriod({
				isLoading: false,
				percentage: 0,
				value: {
					days: 0,
					hours: 0,
					minutes: 0,
					total: 0
				}
			});
		});
	},[api, apiReady, blockTime, network]);

	useEffect(() => {
		if (!api || !apiReady) {
			return;
		}

		setAvailable({
			isLoading: true,
			value: '',
			valueUSD: ''
		});

		setNextBurn({
			isLoading: true,
			value: '',
			valueUSD: ''
		});

		const treasuryAccount = u8aConcat(
			'modl',
			api.consts.treasury && api.consts.treasury.palletId
				? api.consts.treasury.palletId.toU8a(true)
				: `${['polymesh', 'polymesh-test'].includes(network) ? 'pm' : 'pr'}/trsry`,
			EMPTY_U8A_32
		);
		api.derive.balances
			?.account(u8aToHex(treasuryAccount))
			.then((treasuryBalance) => {
				api.query.system.account(treasuryAccount).then(res => {
					const freeBalance = new BN(res?.data?.free) || BN_ZERO;
					treasuryBalance.freeBalance = freeBalance as Balance;
				})
					.catch(e => {
						console.error(e);
						setAvailable({
							isLoading: false,
							value: '',
							valueUSD: ''
						});
					})
					.finally(() => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars

						let valueUSD = '';
						let value = '';
						{
							try{const burn =
							treasuryBalance.freeBalance.gt(BN_ZERO) &&
								!api.consts.treasury.burn.isZero()
								? api.consts.treasury.burn
									.mul(treasuryBalance.freeBalance)
									.div(BN_MILLION)
								: BN_ZERO;

							if(burn) {
								// replace spaces returned in string by format function
								const nextBurnValueUSD = parseFloat(formatBnBalance(
									burn.toString(),
									{
										numberAfterComma: 2,
										withThousandDelimitor: false,
										withUnit: false
									},
									network
								));
								if (nextBurnValueUSD && currentTokenPrice && currentTokenPrice.value) {
									valueUSD = formatUSDWithUnits((nextBurnValueUSD * Number(currentTokenPrice.value)).toString());
								}
								value = formatUSDWithUnits(formatBnBalance(
									burn.toString(),
									{
										numberAfterComma: 0,
										withThousandDelimitor: false,
										withUnit: false
									},
									network
								));
							}
							}catch(error){
								console.log(error);
							}
							setNextBurn({
								isLoading: false,
								value,
								valueUSD
							});
						}
						{
							const freeBalance = treasuryBalance.freeBalance.gt(BN_ZERO)
								? treasuryBalance.freeBalance
								: undefined;

							let valueUSD = '';
							let value = '';

							if (freeBalance) {
								const availableValueUSD = parseFloat(formatBnBalance(
									freeBalance.toString(),
									{
										numberAfterComma: 2,
										withThousandDelimitor: false,
										withUnit: false
									},
									network
								));
								if (availableValueUSD && currentTokenPrice && currentTokenPrice.value !== 'N/A') {
									valueUSD = formatUSDWithUnits((availableValueUSD * Number(currentTokenPrice.value)).toString());
								}
								value = formatUSDWithUnits(formatBnBalance(
									freeBalance.toString(),
									{
										numberAfterComma: 0,
										withThousandDelimitor: false,
										withUnit: false
									}, network
								));
							}

							setAvailable({
								isLoading: false,
								value,
								valueUSD
							});
						}
					});
			});

	}, [api, apiReady, currentTokenPrice, network]);

	// set availableUSD and nextBurnUSD whenever they or current price of the token changes

	// fetch current price of the token
	useEffect(() => {
		if(!network ) return;
		GetCurrentTokenPrice( network ,setCurrentTokenPrice);
	}, [network]);

	// fetch a week ago price of the token and calc priceWeeklyChange
	useEffect(() => {
		let cancel = false;
		if(cancel || !currentTokenPrice.value || currentTokenPrice.isLoading || !network) return;

		setPriceWeeklyChange({
			isLoading: true,
			value: ''
		});
		async function fetchWeekAgoTokenPrice() {
			if (cancel) return;
			const weekAgoDate = dayjs().subtract(7,'d').format('YYYY-MM-DD');
			try {
				const response = await fetch(
					`${chainProperties[network].externalLinks}/api/scan/price/history`,
					{
						body: JSON.stringify({
							end: weekAgoDate,
							start: weekAgoDate
						}),
						headers: subscanApiHeaders,
						method: 'POST'
					}
				);
				const responseJSON = await response.json();
				if (responseJSON['message'] == 'Success') {
					const weekAgoPrice = responseJSON['data']['ema7_average'];
					const currentTokenPriceNum : number = parseFloat(currentTokenPrice.value);
					const weekAgoPriceNum : number = parseFloat(weekAgoPrice);
					if(weekAgoPriceNum == 0) {
						setPriceWeeklyChange({
							isLoading: false,
							value: 'N/A'
						});
						return;
					}
					const percentChange = ((currentTokenPriceNum - weekAgoPriceNum) / weekAgoPriceNum) * 100;
					setPriceWeeklyChange({
						isLoading: false,
						value: percentChange.toFixed(2)
					});
					return;
				}
				setPriceWeeklyChange({
					isLoading: false,
					value: 'N/A'
				});
			} catch(err) {
				setPriceWeeklyChange({
					isLoading: false,
					value: 'N/A'
				});
			}
		}

		fetchWeekAgoTokenPrice();
		return () => {cancel = true;};
	}, [currentTokenPrice, network]);

	return (
		<div className={`${className} grid ${!['polymesh', 'polymesh-test'].includes(network) && 'grid-rows-2'} grid-cols-2 grid-flow-col xs:gap-6 sm:gap-8 xl:gap-4 xl:flex`}>
			{/* Available */}
			<div className="sm:my-0 flex flex-1 bg-white drop-shadow-md p-3 lg:px-6 lg:py-3 rounded-xxl w-full">
				<div className='lg:flex flex-col flex-1 gap-x-0 w-full'>
					<div className='flex justify-center items-center lg:hidden w-full mb-1.5'>
						<Available className='lg:hidden' />
					</div>
					{
						!available.isLoading ?
							<>
								<div className='mb-4'>
									<div className="flex items-center my-1">
										<span className="mr-2 text-xs leading-5 text-lightBlue font-medium p-0">
									Available
										</span>
										<HelperTooltip
											text='Funds collected through a portion of block production rewards, transaction fees, slashing, staking inefficiencies, etc.'
											className='text-xs leading-5 text-lightBlue font-medium'
										/>
									</div>
									<div className="flex justify-between font-medium">
										{
											available.value ?
												<span className='text-lg text-bodyBlue font-medium'>
													{available.value}
													{' '}
													<span className='text-lightBlue text-sm'>
														{chainProperties[network]?.tokenSymbol}
													</span>
												</span>
												: <span>N/A</span>
										}
									</div>
								</div>
								{!['polymesh', 'polymesh-test'].includes(network) && <>
									<div className='flex flex-col justify-center text-bodyBlue font-medium gap-y-3'>
										<Divider
											style={{
												background: '#D2D8E0'
											}}
											className='m-0 p-0' />
										<span className='flex flex-col justify-center text-lightBlue text-xs font-medium'>
											{
												available.valueUSD
													? `~ $${available.valueUSD}`
													: 'N/A'
											}
										</span>
									</div>
								</>}
							</>
							: <div className='min-h-[89px] w-full flex items-center justify-center'>
								<LoadingOutlined />
							</div>
					}
				</div>
				<div>
					<Available className='lg:block xs:hidden'/>
				</div>
			</div>

			{/* CurrentPrice */}
			{network !== 'moonbase' &&
				<div className="sm:my-0 flex flex-1 bg-white drop-shadow-md p-3 lg:px-6 lg:py-3 rounded-xxl w-full">
					<div className='lg:flex flex-col gap-x-0 w-full'>
						<div className='flex justify-center items-center lg:hidden w-full mb-1.5'>
							<CurrentPrice className='lg:hidden' />
						</div>
						{
							!(currentTokenPrice.isLoading || priceWeeklyChange.isLoading)?
								<>
									<div className='mb-4'>
										<div className="flex items-center my-1">
											<span className='hidden mr-2 text-xs leading-5 text-lightBlue font-medium md:flex'>
							Current Price of {chainProperties[network]?.tokenSymbol}
											</span>
											<span className='flex md:hidden text-xs text-lightBlue font-medium'>
							Price {chainProperties[network]?.tokenSymbol}
											</span>
										</div>
										<div className="font-medium text-lg">
											{currentTokenPrice.value === 'N/A' ? <span>N/A</span> : currentTokenPrice.value && !isNaN(Number(currentTokenPrice.value))
												?
												<><span className='text-lightBlue'>$ </span><span className='text-bodyBlue'>{currentTokenPrice.value}</span></>
												: null
											}
										</div>
									</div>
									<div className="flex flex-col justify-center overflow-hidden text-bodyBlue font-medium gap-y-3">
										<Divider
											style={{
												background: '#D2D8E0'
											}}
											className='m-0 p-0' />
										<div className='flex text-xs text-lightBlue md:whitespace-pre items-center'>
											{priceWeeklyChange.value === 'N/A' ? 'N/A' : priceWeeklyChange.value ?
												<>
													<span className="mr-1 sm:mr-2">
													Weekly Change
													</span>
													<div className='flex items-center'>
														<span className='font-semibold'>
															{Math.abs(Number(priceWeeklyChange.value))}%
														</span>
														{Number(priceWeeklyChange.value) < 0 ? <CaretDownOutlined style={{ color: 'red' , marginLeft: '1.5px' }} /> :
															<CaretUpOutlined style={{ color: '#52C41A' , marginLeft: '1.5px' }} /> }
													</div>
												</>
												: null
											}
										</div>
									</div>
								</>
								:  <div className='min-h-[89px] w-full flex items-center justify-center'>
									<LoadingOutlined />
								</div>
						}
					</div>
					<div>
						<CurrentPrice className="xs:hidden lg:block"/>
					</div>
				</div>
			}

			{/* Next Burn */}
			{!['moonbeam', 'moonbase', 'moonriver', 'polymesh'].includes(network) &&
				<div className="sm:my-0 flex flex-1 bg-white drop-shadow-md p-3 lg:px-6 lg:py-3 rounded-xxl w-full">
					<div className='lg:flex flex-col gap-x-0 w-full'>
						<div className='flex justify-center items-center lg:hidden w-full mb-1.5'>
							<NextBurn className='lg:hidden' />
						</div>
						{
							!nextBurn.isLoading?
								<>
									<div className='mb-4'>
										<div className="text-lightBlue text-xs flex items-center my-1">
											<span className="mr-2 text-xs leading-5 text-lightBlue font-medium">
										Next Burn
											</span>

											<HelperTooltip
												text='If the Treasury ends a spend period without spending all of its funds, it suffers a burn of a percentage of its funds.'
											/>
										</div>

										<div className="text-bodyBlue flex justify-between font-medium text-lg">
											{
												nextBurn.value ? (
													<span>
														{nextBurn.value} <span className='text-lightBlue text-sm'>{chainProperties[network]?.tokenSymbol}</span>
													</span>
												) : null
											}
										</div>
									</div>
									<div className='flex flex-col justify-center text-sidebarBlue font-medium gap-y-3'>
										<Divider
											style={{
												background: '#D2D8E0'
											}}
											className='m-0 p-0' />
										<span className='mr-2 text-lightBlue w-full text-xs font-medium'>
											{
												nextBurn.valueUSD
													? `~ $${nextBurn.valueUSD}`
													: 'N/A'
											}
										</span>
									</div>
								</>
								: <div className='min-h-[89px] w-full flex items-center justify-center'>
									<LoadingOutlined />
								</div>
						}
					</div>
					<div>
						<NextBurn className="xs:hidden lg:block"/>
					</div>
				</div>
			}

			{/* Spend Period */}
			{!['polymesh', 'polymesh-test'].includes(network) && <>
				{!inTreasuryProposals &&
				<div className="sm:my-0 flex flex-1 bg-white drop-shadow-md p-3 lg:px-6 lg:py-3 rounded-xxl w-full">
					<div className='lg:flex flex-col gap-x-0 w-full'>
						<div className='flex justify-center items-center lg:hidden w-full mb-1.5'>
							<SpendPeriod className='lg:hidden' />
						</div>
						{
							!spendPeriod.isLoading?
								<>
									<div className='mb-5 sm:mb-4'>
										<div className="flex items-center my-1">
											<span className='mr-2 text-xs mt-1 lg:mt-0 leading-5 text-lightBlue font-medium'>
										Spend Period
											</span>

											<HelperTooltip
												text='Funds held in the treasury can be spent by making a spending proposal that, if approved by the Council, will enter a spend period before distribution, it is subject to governance, with the current default set to 24 days.'
												className='text-xs leading-5 text-lightBlue font-medium'
											/>
										</div>

										<div className="text-bodyBlue flex whitespace-pre font-medium items-baseline mt-1 sm:mt-0">
											{spendPeriod.value?.total
												? <>
													{
														spendPeriod.value?.days?
															<>
																<span className='text-base sm:text-lg'>{spendPeriod.value.days}&nbsp;</span>
																<span className='text-lightBlue text-xs'>days&nbsp;</span>
															</>
															: null
													}
													<>
														<span className='text-base sm:text-lg'>{spendPeriod.value.hours}&nbsp;</span>
														<span className='text-lightBlue text-xs'>hrs&nbsp;</span>
													</>
													{
														!spendPeriod.value?.days?
															<>
																<span className='text-base sm:text-lg'>{spendPeriod.value.minutes}&nbsp;</span>
																<span className='text-lightBlue text-xs'>mins&nbsp;</span>
															</>
															: null
													}
													<span className="text-lightBlue text-[10px] sm:text-xs">/ {spendPeriod.value.total} days </span>
												</>
												: 'N/A'
											}
										</div>
									</div>
									{
										<div className='flex flex-col justify-center font-medium gap-y-3'>
											<Divider
												style={{
													background: '#D2D8E0'
												}}
												className='m-0 p-0' />
											<span className='flex items-center'>
												<Progress className='m-0 p-0 flex items-center' percent={!isNaN(Number(spendPeriod.percentage)) ? spendPeriod.percentage : 0} trailColor='#E1E6EB' strokeColor='#E5007A' size="small" />
											</span>
										</div>
									}
								</>
								:  <div className='min-h-[89px] w-full flex items-center justify-center'>
									<LoadingOutlined />
								</div>
						}
					</div>
					<div>
						<SpendPeriod className="xs:hidden lg:block mt-2"/>
					</div>
				</div>
				}
			</>}
		</div>
	);
};

export default styled(TreasuryOverview)`

.ant-progress-text{
	color: #485F7D !important;
	font-size: 12px !important;
}
.ant-progress-outer {
	display: flex !important;
	align-items: center !important;
}

`;