// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Col, Divider, Row, Tooltip } from 'antd';
import BN from 'bn.js';
import React, { FC, useEffect, useState } from 'react';
import formatBnBalance from 'src/util/formatBnBalance';

import { chainProperties } from '~src/global/networkConstants';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import formatUSDWithUnits from '~src/util/formatUSDWithUnits';

import DelegateModal from './DelegateModal';
import { useNetworkContext } from '~src/context';
import { TrackProps } from '~src/types';
// import DelegateModalEthV2 from './DelegateModalEthV2';

interface IAboutTrackCardProps {
	className?: string;
	trackName: string;
}

const getDefaultTrackMetaData = () => {
	return {
		confirmPeriod: '',
		decisionDeposit: '',
		decisionPeriod: '',
		description: '',
		group: '',
		maxDeciding: '',
		minEnactmentPeriod: '',
		preparePeriod: '',
		trackId: 0
	};
};

export const getTrackData = (network: string, trackName?: string, trackNumber?: number) => {
	const defaultTrackMetaData = getDefaultTrackMetaData();
	if (!network) return defaultTrackMetaData;
	let trackMetaData: TrackProps | undefined = undefined;
	if (trackName) {
		trackMetaData = networkTrackInfo[network][trackName];
	} else if (trackNumber || trackNumber === 0) {
		trackMetaData = Object.values(networkTrackInfo[network]).find((v) => v && v.trackId === trackNumber);
	}
	if (trackMetaData) {
		Object.keys(defaultTrackMetaData).forEach((key) => {
			(defaultTrackMetaData as any)[key] = trackMetaData?.[key];
		});
	}
	const tracks = localStorage.getItem('tracks');
	if (tracks) {
		const tracksArr = JSON.parse(tracks) as any[];
		if (tracksArr && Array.isArray(tracksArr) && tracksArr.length > 0) {
			const currTrackMetaDataArr = tracksArr.find((v) => v && Array.isArray(v) && v.length > 1 && v[0] === trackMetaData?.trackId);
			if (currTrackMetaDataArr && Array.isArray(currTrackMetaDataArr) && currTrackMetaDataArr.length >= 2) {
				const currTrackMetaData = currTrackMetaDataArr[1];
				const keys = ['confirmPeriod', 'decisionDeposit', 'decisionPeriod', 'maxDeciding', 'minEnactmentPeriod', 'preparePeriod'];
				keys.forEach((key) => {
					if (currTrackMetaData[key]) {
						(defaultTrackMetaData as any)[key] = currTrackMetaData[key];
					}
				});
			}
		}
	}
	return defaultTrackMetaData;
};

export const blocksToRelevantTime = (network: string, blocks:number): string => {
	const blockTimeSeconds:number = chainProperties?.[network]?.blockTime / 1000;
	let divisor:number = 1;
	let text:string = 'sec';

	const blockSeconds = blocks*blockTimeSeconds;

	if(blockSeconds > 60 && blockSeconds <= 3600) {
		divisor = 60;
		text = 'min';
	} else if (blockSeconds > 3600 && blockSeconds < 86400) {
		divisor = 3600;
		text = 'hrs';
	} else if (blockSeconds >= 86400) {
		divisor = 86400;
		text = 'days';
	}

	return `${blockSeconds/divisor} ${text}`;
};

const AboutTrackCard: FC<IAboutTrackCardProps> = (props) => {
	const { network } = useNetworkContext();

	const { className, trackName } = props;
	const [trackMetaData, setTrackMetaData] = useState(getDefaultTrackMetaData());
	useEffect(() => {
		setTrackMetaData(getTrackData(network, trackName));
	}, [network, trackName]);

	return (
		<div className={`${className} bg-white drop-shadow-md rounded-[14px] p-4 md:p-8 text-sidebarBlue`}>
			<div className="flex justify-between capitalize font-medium">
				<div className='flex items-center gap-x-2'>
					<h2 className="text-[20px] capitalize font-semibold text-base leading-30">

						About {trackName.split(/(?=[A-Z])/).join(' ')}
					</h2>
					<Tooltip color='#E5007A' title='Track Number' className='cursor-pointer'>
						<h4 className=' text-[#E5007A] text-[16px] font-medium leading-[18px] tracking-[0.01em]'>
							(#{trackMetaData.trackId})
						</h4>
					</Tooltip>
				</div>
			</div>

			<p className="mt-[0px] font-normal text-[14px] leading-6 tracking-wider text-[#334D6E] ">{trackMetaData?.description}</p>

			<div className="mt-8 text-xs w-full max-w-[1000px] ">
				<Row gutter={[{ lg: 32, md: 16, sm: 4, xl: 32, xs: 4, xxl: 32 }, 16]} >
					<Col xs={24} sm={24} md={12} lg={12} xl={8} >
						{trackMetaData.maxDeciding && <Row className='flex flex-col '>
							<Col span={15} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>MAX DECIDING</Col>
							<Col span={9} className='text-[18px] font-semibold uppercase'>{trackMetaData.maxDeciding}</Col>
						</Row>
						}

						{trackMetaData.decisionDeposit && <Row className='mt-[54px] flex flex-col'>
							<Col span={15} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>DECISION DEPOSIT</Col>
							<Col span={9} className='text-[18px] font-semibold leading-27 uppercase' >
								{trackMetaData.decisionDeposit &&
									formatUSDWithUnits(formatBnBalance(`${trackMetaData.decisionDeposit}`.startsWith('0x') ? new BN(`${trackMetaData.decisionDeposit}`.slice(2), 'hex') : trackMetaData.decisionDeposit, { numberAfterComma: 2,
										withThousandDelimitor: false, withUnit: true }, network), 1)
								}
							</Col>
						</Row>
						}
					</Col>

					<Col xs={24} sm={24} md={12} lg={12} xl={8}>

						{trackMetaData.confirmPeriod && <Row className='flex flex-col'>
							<Col span={15} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>CONFIRM PERIOD</Col>
							<Col span={9} className='whitespace-pre text-[18px] font-semibold leading-27'>{blocksToRelevantTime(network, Number(trackMetaData.confirmPeriod))}</Col>
						</Row>}

						{trackMetaData.preparePeriod && <Row className='mt-[54px] flex flex-col'>
							<Col span={15} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>PREPARE PERIOD</Col>
							<Col span={9} className='whitespace-pre text-[18px] font-semibold leading-27'>{blocksToRelevantTime(network, Number(trackMetaData.preparePeriod))}</Col>
						</Row>}
					</Col>

					<Col xs={24} sm={24} md={12} lg={12} xl={8}>
						{trackMetaData.minEnactmentPeriod &&<Row className='flex flex-col'>
							<Col xs={15} xl={19} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>MIN ENACTMENT PERIOD</Col>
							<Col xs={9} xl={5} className='whitespace-pre text-[18px] font-semibold leading-27'>{blocksToRelevantTime(network, Number(trackMetaData.minEnactmentPeriod))}</Col>
						</Row>}

						{trackMetaData.decisionPeriod && <Row className='mt-[54px] flex flex-col'>
							<Col xs={15} xl={19} className='font-medium mb-[6px] text-[14px] text-[#A0AAB9]'>DECISION PERIOD</Col>
							<Col xs={9} xl={5} className='whitespace-pre text-[18px] font-semibold leading-27'>{blocksToRelevantTime(network,Number(trackMetaData.decisionPeriod))}</Col>
						</Row>}
					</Col>
				</Row>
			</div>

			<Divider />

			<div className="flex justify-end">
				{!['moonbeam', 'moonbase', 'moonriver'].includes(network) &&
					<DelegateModal trackNum={trackMetaData?.trackId} />}
			</div>

		</div>
	);
};

export default AboutTrackCard;
