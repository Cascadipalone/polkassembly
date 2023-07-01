// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedAccount } from '@polkadot/extension-inject/types';
import { Alert, Button, Form } from 'antd';
import BN from 'bn.js';
import Image from 'next/image';
import React, { useEffect,useState } from 'react';
import { LoadingStatusType, NotificationStatus } from 'src/types';
import AccountSelectionForm from 'src/ui-components/AccountSelectionForm';
import BalanceInput from 'src/ui-components/BalanceInput';
import Loader from 'src/ui-components/Loader';
import queueNotification from 'src/ui-components/QueueNotification';
import styled from 'styled-components';
import { useApiContext, useUserDetailsContext } from '~src/context';
import LoginToEndorse from '../LoginToVoteOrEndorse';

interface Props {
	accounts: InjectedAccount[]
	address: string
	className?: string
	getAccounts: () => Promise<undefined>
	tipHash?: string
	onAccountChange: (address: string) => void
}

const EndorseTip = ({
	accounts,
	address,
	className,
	getAccounts,
	tipHash,
	onAccountChange
}: Props) => {
	const ZERO = new BN(0);
	const [loadingStatus, setLoadingStatus] = useState<LoadingStatusType>({ isLoading: false, message:'' });
	const [endorseValue, setEndorseValue] = useState<BN>(ZERO);
	const [isCouncil, setIsCouncil] = useState(false);
	const [forceEndorse, setForceEndorse] = useState(false);
	const [currentCouncil, setCurrentCouncil] = useState<string[]>([]);
	const { api, apiReady } = useApiContext();
	const { addresses, isLoggedOut } = useUserDetailsContext();

	useEffect(() => {
		// it will iterate through all addresses
		addresses && addresses.some(address => {
			if (currentCouncil.includes(address)) {
				setIsCouncil(true);
				// this breaks the loop as soon as we find a matching address
				return true;
			}
			return false;
		});
	}, [addresses, currentCouncil]);

	useEffect(() => {
		if (!api) {
			return;
		}

		if (!apiReady) {
			return;
		}

		try {
			api.query.council.members().then((memberAccounts) => {
				setCurrentCouncil(memberAccounts.map(member => member.toString()));
			});
		} catch (error) {
			// console.log(error);
		}

	}, [api, apiReady]);

	const onValueChange = (balance: BN) => setEndorseValue(balance);

	const handleEndorse = async () => {
		if (!tipHash) {
			console.error('tipHash not set');
			return;
		}

		if (!api) {
			return;
		}

		if (!apiReady) {
			return;
		}

		setLoadingStatus({ isLoading: true, message: 'Waiting for signature' });
		const endorse = api.tx.treasury.tip(tipHash, endorseValue);

		endorse.signAndSend(address, ({ status }) => {
			if (status.isInBlock) {
				queueNotification({
					header: 'Success!',
					message: `Endorse tip #${tipHash} successful.`,
					status: NotificationStatus.SUCCESS
				});
				setLoadingStatus({ isLoading: false, message: '' });
				console.log(`Completed at block hash #${status.asInBlock.toString()}`);
			} else {
				if (status.isBroadcast){
					setLoadingStatus({ isLoading: true, message: 'Broadcasting the endorsement' });
				}
				console.log(`Current status: ${status.type}`);
			}
		}).catch((error) => {
			setLoadingStatus({ isLoading: false, message: '' });
			console.log(':( transaction failed');
			console.error('ERROR:', error);
			queueNotification({
				header: 'Failed!',
				message: error.message,
				status: NotificationStatus.ERROR
			});
		});
	};

	const GetAccountsButton = () =>
		<Form>
			<Form.Item className='button-container'>
				<div>Only council members can endorse tips.</div><br/>
				<Button
					onClick={getAccounts}
				>
					Endorse
				</Button>
			</Form.Item>
		</Form>;

	const noAccount = accounts.length === 0;
	if (isLoggedOut()) {
		return <LoginToEndorse to='Endorse' />;
	}
	const endorse = noAccount
		? <GetAccountsButton/>
		: loadingStatus.isLoading
			? <div className={'LoaderWrapper'}>
				<Loader text={loadingStatus.message}/>
			</div>
			: <div>
				<AccountSelectionForm
					title='Endorse with account'
					accounts={accounts}
					address={address}
					onAccountChange={onAccountChange}
					withBalance
				/>
				<BalanceInput
					label={'Value'}
					helpText={'Allocate a suggested tip amount. With enough endorsements, the suggested values are averaged and sent to the beneficiary.'}
					placeholder={'123'}
					onChange={onValueChange}
				/>
				<Button
					disabled={!apiReady}
					onClick={handleEndorse}
				>
					Endorse
				</Button>
			</div>;

	const NotCouncil = () =>
		<>
			<h3 className='dashboard-heading mb-6'>Endorse with account!</h3>
			<Alert className='mb-6' type='warning' message={<div className='flex items-center gap-x-2'>
				<span>
					No account found from the council
				</span>
				<Image width={25} height={25} src='/assets/frowning-face.png' alt="frowning face" />
			</div>} />
			<Button onClick={() => setForceEndorse(true)}>Let me try still.</Button>
		</>;

	return (
		<div className={className}>
			{isCouncil || forceEndorse
				? endorse
				: <NotCouncil/>
			}
		</div>
	);
};

export default styled(EndorseTip)`
	.LoaderWrapper {
		height: 15rem;
		position: absolute;
		width: 100%;
	}
`;
