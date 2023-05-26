// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import CloseIcon from '~assets/icons/close.svg';
import SuccessIcon from '~assets/delegation-tracks/success-delegate.svg';
import UndelegateCloseIcon from '~assets/icons/white-close.svg';
import { poppins } from 'pages/_app';
import BN from 'bn.js';

import { useNetworkContext } from '~src/context';
import Address from '~src/ui-components/Address';
import { formatBalance } from '@polkadot/util';
import { chainProperties } from '~src/global/networkConstants';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import { useRouter } from 'next/router';

interface Props{
  className?: string;
  open: boolean;
  setOpen: (pre:boolean) => void;
  tracks?: CheckboxValueType[];
  address?: string;
  isDelegate?: boolean;
  balance: BN;
  trackNum?: number;
  conviction?: number;

}

const DelegationSuccessPopup = ({ className, open, setOpen, tracks, address, isDelegate, balance, conviction }: Props) => {
	const { network } = useNetworkContext();
	const unit =`${chainProperties[network]?.tokenSymbol}`;
	const router = useRouter();

	useEffect(() => {
		if(!network) return ;
		formatBalance.setDefaults({
			decimals: chainProperties[network].tokenDecimals,
			unit: chainProperties[network].tokenSymbol
		});

	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Modal
		zIndex={100000}
		open={open}
		className={`${poppins.variable} ${poppins.className} ${isDelegate ? 'delegate' : 'undelegate'}`}
		wrapClassName={className}
		closeIcon={isDelegate ? <CloseIcon/> : <UndelegateCloseIcon/>}
		onCancel={() => {setOpen(false); router.reload();}}
		centered
		footer={false}
		maskClosable={false}
	>
		<div className='flex justify-center items-center flex-col -mt-[132px]'>
			<SuccessIcon/>
			<h2 className='text-[20px] font-semibold tracking-[0.0015em] mt-6'>{isDelegate ? 'Delegated successfully' : 'Undelegated successfully' }</h2>
			{isDelegate && <div className='flex flex-col justify-center items-center gap-[18px]'>
				{balance && <div className='text-pink_primary text-[24px] font-semibold'>{formatBalance(balance.toString(),{ forceUnit: unit })}</div>}
				<div className='flex-col flex items-start justify-center gap-[10px]'>
					{address && <div className='flex gap-4 text-sm text-[#485F7D]'>To address:<span>
						<Address address={address}
							className='address'
							displayInline={true}/>
					</span>
					</div>}
					<div className='flex gap-4 text-sm text-[#485F7D]'> Conviction:<span className='text-[#243A57] font-medium'>{conviction}x</span> </div>
					{tracks && <div className='flex gap-[35px] text-sm text-[#485F7D]'>Track(s):<span>
						<div className={`flex flex-col gap-1 min-h-[50px] max-h-[100px] text-[#243A57] pr-2 font-medium ${tracks.length > 4 && 'overflow-y-scroll'}`}>
							{tracks.map((track, index) => (<div key={index}>{track} #{networkTrackInfo[network][track.toString()].trackId}</div>))}</div>
					</span>
					</div>}
				</div></div>}
		</div>

	</Modal>;
};

export default DelegationSuccessPopup;
