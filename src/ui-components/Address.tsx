// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DeriveAccountFlags, DeriveAccountInfo, DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { Skeleton, Space, Tooltip } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { IGetProfileWithAddressResponse } from 'pages/api/v1/auth/data/profileWithAddress';
import React, { useContext, useEffect, useState } from 'react';
import { ApiContext } from 'src/context/ApiContext';
import styled from 'styled-components';

import { useNetworkContext } from '~src/context';
import getEncodedAddress from '~src/util/getEncodedAddress';
import nextApiClientFetch from '~src/util/nextApiClientFetch';

import shortenAddress from '../util/shortenAddress';
import EthIdenticon from './EthIdenticon';
import IdentityBadge from './IdentityBadge';
import getSubstrateAddress from '~src/util/getSubstrateAddress';
import { getKiltDidName } from '~src/util/kiltDid';
import dayjs from 'dayjs';
import classNames from 'classnames';
import { ApiPromise } from '@polkadot/api';
import { network as AllNetworks } from '~src/global/networkConstants';
import MANUAL_USERNAME_25_CHAR from '~src/auth/utils/manualUsername25Char';

export enum EAddressOtherTextType {
	CONNECTED='Connected',
	COUNCIL='Council',
	COUNCIL_CONNECTED='Council (Connected)',
	LINKED_ADDRESS= 'Linked',
    UNLINKED_ADDRESS = 'Address not linked',
}

interface Props {
	address: string
	className?: string
	displayInline?: boolean
	disableIdenticon?: boolean
	extensionName?: string
	popupContent?: string
	disableAddress?:boolean
	shortenAddressLength?:number
	isShortenAddressLength?:boolean
	textClassName?:string
	identiconSize?: number;
	ethIdenticonSize?: number;
	disableHeader?: boolean;
	disableAddressClick?: boolean;
	isSubVisible?: boolean;
	addressClassName?: string;
	clickable?:boolean;
	truncateUsername?:boolean;
	otherTextType?: EAddressOtherTextType;
	otherTextClassName?: string;
	passedUsername?:string
	isVoterAddress?: boolean;
}

const Identicon = dynamic(() => import('@polkadot/react-identicon'), {
	loading: () => <Skeleton.Avatar active size='large' shape='circle' /> ,
	ssr: false
});

const Address = ({ address, className, displayInline, disableIdenticon, extensionName, popupContent, disableAddress, textClassName, shortenAddressLength, isShortenAddressLength = true, identiconSize, ethIdenticonSize, disableHeader, disableAddressClick, isSubVisible = true, addressClassName, clickable=true , truncateUsername = true, otherTextType, otherTextClassName, passedUsername = '', isVoterAddress }: Props): JSX.Element => {
	const { network } = useNetworkContext();
	const apiContext = useContext(ApiContext);
	const [api, setApi] = useState<ApiPromise>();
	const [apiReady, setApiReady] = useState(false);
	const [mainDisplay, setMainDisplay] = useState<string>('');
	const [sub, setSub] = useState<string | null>(null);
	const [identity, setIdentity] = useState<DeriveAccountRegistration | null>(null);
	const [flags, setFlags] = useState<DeriveAccountFlags | undefined>(undefined);
	const router = useRouter();
	const [username, setUsername] = useState(passedUsername);
	const [kiltName, setKiltName] = useState('');
	const[isAutoGeneratedUsername,setIsAutoGeneratedUsername] = useState(true);

	useEffect(() => {
		if (network === AllNetworks.COLLECTIVES && (apiContext.relayApi && apiContext.relayApiReady)) {
			setApi(apiContext.relayApi);
			setApiReady(apiContext.relayApiReady);
		} else {
			if (!apiContext.api || !apiContext.apiReady) return;
			setApi(apiContext.api);
			setApiReady(apiContext.apiReady);
		}
	}, [network, apiContext.api, apiContext.apiReady, apiContext.relayApi, apiContext.relayApiReady]);

	const encoded_addr = address ? getEncodedAddress(address, network) || '' : '';
	const FEATURE_RELEASE_DATE = dayjs('2023-06-12').toDate(); // Date from which we are sending custom username flag on web3 sign up.

	const fetchUsername = async (isOnclick:boolean) => {
		if (isVoterAddress) {
			return;
		}
		const substrateAddress = getSubstrateAddress(address);

		if (substrateAddress) {
			try {
				const { data, error } = await nextApiClientFetch<IGetProfileWithAddressResponse>(`api/v1/auth/data/profileWithAddress?address=${substrateAddress}`, undefined, 'GET');
				if (error|| !data || !data.username) {
					return;
				}
				setUsername(data.username);
				if(isOnclick){
					router.push(`/user/${data.username}`);
					return;
				}

				if(MANUAL_USERNAME_25_CHAR.includes(data.username) || data.custom_username || data.username.length !== 25){
					setIsAutoGeneratedUsername(false);
					return;
				}
				else if((data.web3Signup && !data.created_at && data.username.length === 25 ) || (data.web3Signup && data.username.length === 25 &&  dayjs(data.created_at).isBefore(dayjs(FEATURE_RELEASE_DATE))) ){
					setIsAutoGeneratedUsername(true);
				}

			} catch (error) {
				// console.log(error);
			}

		}
	};

	const shortenUsername = (username:string) => {
		if(username.length > 19){
			return shortenAddress(username,8);
		}
		return username;
	};

	const getKiltName = async () => {
		if (!api || !apiReady) return;

		const web3Name = await getKiltDidName(api, address);
		setKiltName(web3Name ? `w3n:${web3Name}` : '');
	};

	useEffect( () => {
		try {
			if(!username)
				fetchUsername(false);
		} catch (error) {
			// console.log(error);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[]);

	useEffect(() => {
		if (!api || !apiReady) return;

		let unsubscribe: () => void;

		api.derive.accounts.info(encoded_addr, (info: DeriveAccountInfo) => {
			setIdentity(info.identity);
			if (info.identity.displayParent && info.identity.display){
				// when an identity is a sub identity `displayParent` is set
				// and `display` get the sub identity
				setMainDisplay(info.identity.displayParent);
				setSub(info.identity.display);
			} else {
				// There should not be a `displayParent` without a `display`
				// but we can't be too sure.
				setMainDisplay(info.identity.displayParent || info.identity.display|| (!isAutoGeneratedUsername ? shortenUsername(username) : null) || info.nickname || '' );
			}
		})
			.then(unsub => { unsubscribe = unsub; })
			.catch(e => console.error(e));

		return () => unsubscribe && unsubscribe();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [encoded_addr, api, apiReady]);

	useEffect(() => {
		if (!api || !apiReady) return;

		let unsubscribe: () => void;

		api.derive.accounts.flags(encoded_addr, (result: DeriveAccountFlags) => {
			setFlags(result);
		})
			.then(unsub => { unsubscribe = unsub; })
			.catch(e => console.error(e));

		return () => unsubscribe && unsubscribe();
	}, [encoded_addr, api, apiReady]);

	useEffect(() => {
		if(network === 'kilt') {
			getKiltName();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [api, apiReady, network]);

	const t1 = kiltName || mainDisplay || (!isAutoGeneratedUsername ? username : null) || (isShortenAddressLength? shortenAddress(encoded_addr, shortenAddressLength): encoded_addr) || shortenUsername(username);
	const t2 = extensionName || mainDisplay;
	return (
		<div className={displayInline ? `${className} display_inline`: className}>
			{
				!disableIdenticon ?
					encoded_addr.startsWith('0x') ?
						<EthIdenticon className='image identicon flex items-center' size={ethIdenticonSize? ethIdenticonSize: 26} address={encoded_addr} />
						:
						<Identicon
							className='image identicon'
							value={encoded_addr}
							size={identiconSize? identiconSize:displayInline ? 20 : 32}
							theme={'polkadot'}
						/>
					:
					null
			}
			{!disableAddress && <div className={`content ${clickable ? 'cursor-pointer' : 'cursor-not-allowed' }`} onClick={async () => {
				if(!clickable){
					return;
				}
				if (!disableAddressClick) {
					await fetchUsername(true);
				}
			}}>
				{displayInline
				// When inline disregard the extension name.
					? popupContent
						? <Space>
							{(kiltName || identity && mainDisplay) && <IdentityBadge address={address} identity={identity} flags={flags} web3Name={kiltName} />}
							<Tooltip color='#E5007A' title={popupContent}>
								<div className={'header display_inline identityName max-w-[30px] flex flex-col gap-y-1  text-navBlue'}>
									{ t1 && <span className={`truncate ${textClassName}`}>{t1}</span> }
									{sub && isSubVisible && <span className={`sub truncate ${textClassName}`}>{sub}</span>}
								</div>
							</Tooltip>
						</Space>
						: <>
							<div className={'description display_inline flex items-center'}>
								{identity && mainDisplay && <IdentityBadge address={address} identity={identity} flags={flags} className='text-navBlue' />}
								<span title={mainDisplay || encoded_addr} className={`max-w-[85px] flex gap-x-1 text-bodyBlue font-semibold ${textClassName}`}>
									{ t1 && <span className={`${truncateUsername && 'truncate'}`}>{ t1 }</span> }
									{sub && isSubVisible && <span className={`sub truncate ${textClassName}`}>{sub}</span>}
								</span>
							</div>
						</>
					: extensionName || mainDisplay
						? popupContent
							?
							<Tooltip color='#E5007A' title={popupContent}>
								<Space>
									<Space className={'header'}>
										{(kiltName || identity && mainDisplay) && !extensionName && <IdentityBadge address={address} identity={identity} flags={flags} web3Name={kiltName} />}
										<span className='bg-red-500 identityName max-w-[85px] flex flex-col gap-y-1 text-navBlue'>
											{ t2 && <span className={`${textClassName} truncate `}>{ t2 }</span> }
											{!extensionName && sub && isSubVisible && <span className={`${textClassName} sub truncate text-navBlue`}>{sub}</span>}
										</span>
									</Space>
									<div className={'description display_inline'}>{isShortenAddressLength? shortenAddress(encoded_addr, shortenAddressLength): encoded_addr}</div>
								</Space>
							</Tooltip>
							: <div>
								{
									!disableHeader ?
										<Space className={'header'}>
											{(kiltName || identity && mainDisplay) && !extensionName && <IdentityBadge address={address} identity={identity} flags={flags} web3Name={kiltName} />}
											<span className='identityName max-w-[85px] flex flex-col gap-y-1 text-bodyBlue'>
												{ t2 && <span className={` ${textClassName} truncate font-semibold`}>{ t2 }</span> }
												{!extensionName && sub && isSubVisible && <span className={`${textClassName} sub truncate font-semibold`}>{sub}</span>}
											</span>
										</Space>
										: null
								}
								<div className={`description ml-0.5 ${addressClassName} text-xs`}>{isShortenAddressLength? shortenAddress(encoded_addr, shortenAddressLength): encoded_addr}</div>
							</div>
						: <div className={`description ${addressClassName} text-xs`}>{kiltName ? t1 : isShortenAddressLength? shortenAddress(encoded_addr, shortenAddressLength): encoded_addr}</div>
				}
			</div>}
			{
				otherTextType? <p className={`m-0 flex items-center gap-x-1 text-lightBlue leading-[15px] text-[10px] ${otherTextClassName}`}>
					<span
						className={classNames('w-[6px] h-[6px] rounded-full', {
							'bg-aye_green ': [EAddressOtherTextType.CONNECTED, EAddressOtherTextType.COUNCIL_CONNECTED].includes(otherTextType),
							'bg-blue ': otherTextType === EAddressOtherTextType.COUNCIL,
							'bg-nay_red': [EAddressOtherTextType.LINKED_ADDRESS, EAddressOtherTextType.UNLINKED_ADDRESS].includes(otherTextType)
						})}
					>
					</span>
					<span className='text-xs text-lightBlue'>
						{otherTextType}
					</span>
				</p>: null
			}
		</div>
	);
};

export default styled(Address)`
	position: relative;
	display: flex;
	align-items: center;

	.content {
		display: inline-block;
		color: nav_blue !important;
	}

	.identicon {
		margin-right: 0.25rem;
	}

	.identityName {
		filter: grayscale(100%);
	}

	.header {
		color: black_text;
		font-weight: 500;
		margin-right: 0.4rem;
	}

	.description {
		color: nav_blue;
		margin-right: 0.4rem;
		
	}

	.display_inline {
		display: inline-flex !important;
	}

	.sub {
		color: nav_blue;
		line-height: inherit;
	}
`;
