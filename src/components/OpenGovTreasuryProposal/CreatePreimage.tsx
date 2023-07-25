// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, FormInstance, Input, Radio, Spin } from 'antd';
import { EEnactment, IEnactment, IPreimage, ISteps } from '.';
import HelperTooltip from '~src/ui-components/HelperTooltip';
import Address from '~src/ui-components/Address';
import BN from 'bn.js';
import dynamic from 'next/dynamic';
import SelectTracks from './SelectTracks';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import { useApiContext, useNetworkContext } from '~src/context';
import AddressInput from '~src/ui-components/AddressInput';
import Web3 from 'web3';
import getEncodedAddress from '~src/util/getEncodedAddress';
import styled from 'styled-components';
import DownArrow from '~assets/icons/down-icon.svg';
import { GetCurrentTokenPrice } from '../Home/TreasuryOverview';
import { BN_HUNDRED, BN_ONE, BN_THOUSAND, formatBalance, isHex } from '@polkadot/util';
import { isWeb3Injected } from '@polkadot/extension-dapp';
import { Injected, InjectedWindow } from '@polkadot/extension-inject/types';
import { APPNAME } from '~src/global/appName';
import queueNotification from '~src/ui-components/QueueNotification';
import { NotificationStatus } from '~src/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { blake2AsHex } from '@polkadot/util-crypto';
import { HexString } from '@polkadot/util/types';
import { LoadingOutlined } from '@ant-design/icons';
import { chainProperties } from '~src/global/networkConstants';
import { formatedBalance } from '../DelegationDashboard/ProfileBalance';
import { useCurrentBlock } from '~src/hooks';
import { Proposal } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import Balance from '../Balance';
import { inputToBn } from '~src/util/inputToBn';
import { Bytes } from '@polkadot/types';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { IPreimageData } from 'pages/api/v1/preimages/latest';
import _ from 'lodash';
import { poppins } from 'pages/_app';
import executeTx from '~src/util/executeTx';

const BalanceInput = dynamic(() => import('~src/ui-components/BalanceInput'), {
	ssr: false
});

const ZERO_BN = new BN(0);
const EMPTY_HASH = blake2AsHex('');

interface Props{
  className?: string;
  isPreimage: boolean | null;
  setIsPreimage: (pre: boolean) => void;
  preimageHash: string;
  setPreimageHash: (pre: string) => void;
  setSteps: (pre: ISteps)=> void;
  proposerAddress: string;
  beneficiaryAddress: string;
  setBeneficiaryAddress: (pre: string) => void;
  fundingAmount:BN;
  setFundingAmount:(pre: BN) => void;
  selectedTrack: string;
  setSelectedTrack: (pre: string) => void;
  enactment: IEnactment;
  setEnactment: (pre: IEnactment) => void;
  setPreimage: (pre: IPreimage) => void;
  preimage: IPreimage | undefined;
  form: FormInstance;
  preimageLength: number | null;
  setPreimageLength: (pre:number | null) => void;
}

interface IAdvancedDetails{
  afterNoOfBlocks:  BN | null;
  atBlockNo: BN | null
}

const CreatePreimage = ({ className, isPreimage, setIsPreimage, setSteps, preimageLength, setPreimageLength, preimageHash, setPreimageHash, fundingAmount, setFundingAmount, selectedTrack, setSelectedTrack, proposerAddress, beneficiaryAddress, setBeneficiaryAddress, enactment, setEnactment, setPreimage, form }:Props) => {

	const { api, apiReady } = useApiContext();
	const { network } = useNetworkContext();
	const [preimageCreated, setPreimageCreated] = useState<boolean>(false);
	const [preimageLinked, setPreimageLinked] = useState<boolean>(false);
	const unit = `${chainProperties[network]?.tokenSymbol}`;
	const [addressAlert, setAddressAlert] = useState<boolean>(false);
	const [openAdvanced, setOpenAdvanced] = useState<boolean>(false);
	const [validBeneficiaryAddress, setValidBeneficiaryAddress] = useState<boolean>(false);
	const [inputAmountValue, setInputAmountValue] = useState<string>('0');
	const [txFee, setTxFee] = useState(ZERO_BN);
	const [showAlert, setShowAlert] = useState<boolean>(false);
	const [availableBalance, setAvailableBalance] = useState<BN>(ZERO_BN);
	const [isAutoSelectTrack, setIsAutoSelectTrack] = useState<boolean>(true);
	const [currentTokenPrice, setCurrentTokenPrice] = useState({
		isLoading: true,
		value: ''
	});
	const [loading, setLoading] = useState<boolean>(false);
	const currentBlock = useCurrentBlock();
	const checkPreimageHash = (preimageLength: number| null, preimageHash: string) => {
		if((!preimageHash ||( preimageLength === null))) return false;
		return (!isHex(preimageHash, 256) || (!preimageLength || preimageLength === 0));
	};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const invalidPreimageHash = useCallback(() => checkPreimageHash(preimageLength, preimageHash),[preimageHash, preimageLength]);

	const [advancedDetails, setAdvancedDetails] = useState<IAdvancedDetails>({ afterNoOfBlocks:  BN_HUNDRED, atBlockNo: BN_ONE });

	const trackArr: string[] = [];
	const maxSpendArr: {track: string, maxSpend: number}[] = [];

	if(network){
		Object.entries(networkTrackInfo?.[network]).forEach(([key, value]) => {
			if(value.group === 'Treasury'){
				trackArr.push(key);
				maxSpendArr.push({ maxSpend: value?.maxSpend, track: key });
			}
		});
	}

	maxSpendArr.sort((a,b) => a.maxSpend - b.maxSpend );

	const handleStateChange = (createPreimageForm: any) => {
		setSteps({ percent: 20, step: 1 });
		(createPreimageForm.preimageHash && createPreimageForm.preimageLength  && createPreimageForm.beneficiaryAddress && createPreimageForm?.fundingAmount && createPreimageForm?.selectedTrack) &&  setSteps({ percent: 100, step: 1 });
		(createPreimageForm.beneficiaryAddress && createPreimageForm?.fundingAmount && createPreimageForm?.selectedTrack) && setSteps({ percent: 100, step: 1 });
		createPreimageForm?.selectedTrack && setIsAutoSelectTrack(false);

		setAdvancedDetails({ ...advancedDetails, atBlockNo: currentBlock?.add(BN_THOUSAND) || BN_ONE });
		const balance = new BN(createPreimageForm?.fundingAmount) ;
		setInputAmountValue(createPreimageForm?.fundingAmount);
		setPreimageHash(createPreimageForm?.preimageHash || '') ;
		setPreimageLength(createPreimageForm?.preimageLength || null);
		setBeneficiaryAddress(createPreimageForm?.beneficiaryAddress || '');
		setEnactment(createPreimageForm?.enactment || { key: EEnactment.After_No_Of_Blocks, value: BN_HUNDRED });
		setBeneficiaryAddress(createPreimageForm.beneficiaryAddress || '');
		setFundingAmount(balance);
		setSelectedTrack(createPreimageForm?.selectedTrack || '');

		form.setFieldValue('preimage_hash', createPreimageForm?.preimageHash || '');
		form.setFieldValue('preimage_length', createPreimageForm?.preimageLength || 0);
		form.setFieldValue('funding_amount', createPreimageForm?.fundingAmount);
		form.setFieldValue('address', createPreimageForm.beneficiaryAddress || '');
		form.setFieldValue('at_block', currentBlock?.add(BN_THOUSAND) || BN_ONE  );

		if(createPreimageForm?.enactment) {
			setOpenAdvanced(true);
			form.setFieldValue(createPreimageForm?.enactment?.key === EEnactment.At_Block_No ? 'at_block' : 'after_blocks', createPreimageForm?.enactment?.value || null );
		}
	};

	useEffect(() => {
		form.setFieldValue('at_block', currentBlock?.add(BN_THOUSAND) || BN_ONE  );
		let data: any = localStorage.getItem('treasuryProposalData');
		data = JSON.parse(data);
		if(data && data?.createPreimageForm){
			const isPreimage = data?.isPreimage;
			setIsPreimage(isPreimage);
			setSteps({ percent: 20, step: 1 });
			const createPreimageForm = data?.createPreimageForm?.[!isPreimage ? 'withoutPreimageForm' : 'withPreimageForm'] ;
			handleStateChange(createPreimageForm);
			data.preimageCreated && setPreimageCreated(data.preimageCreated);
			data.preimageLinked && setPreimageLinked(data.preimageLinked);
		}
		if(!network) return ;
		formatBalance.setDefaults({
			decimals: chainProperties[network].tokenDecimals,
			unit: chainProperties[network].tokenSymbol
		});
		GetCurrentTokenPrice(network, setCurrentTokenPrice);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[]);

	const onChangeLocalStorageSet = (obj: any, isPreimage: boolean, preimageCreated?: boolean, preimageLinked?: boolean, isPreimageStateChange?: boolean) => {
		let data: any = localStorage.getItem('treasuryProposalData');
		if(data){data = JSON.parse(data);}

		const createPreimageFormKey = !isPreimage ? 'withoutPreimageForm' : 'withPreimageForm';
		const createPreimageFormData = data?.createPreimageForm || {};
		const createPreimageKeysData = data?.createPreimageForm?.[createPreimageFormKey] || {};
		localStorage.setItem('treasuryProposalData', JSON.stringify({
			...data,
			createPreimageForm: {
				...createPreimageFormData,
				[createPreimageFormKey]: { ...createPreimageKeysData, ...obj }
			},
			isPreimage: isPreimage,
			preimageCreated: Boolean(preimageCreated),
			preimageLinked: Boolean(preimageLinked),
			step: 0
		}));

		if(isPreimageStateChange) {
			handleStateChange(createPreimageKeysData || {});
			setAdvancedDetails({ ...advancedDetails, atBlockNo: currentBlock?.add(BN_THOUSAND) || BN_ONE });
			form.setFieldValue('at_block',currentBlock?.add(BN_THOUSAND) || BN_ONE  );
			data.preimageCreated && setPreimageCreated(data.preimageCreated);
			data.preimageLinked && setPreimageLinked(data.preimageLinked);
			setIsAutoSelectTrack(true);
			setOpenAdvanced(false);
		}

	};
	const getPreimageTxFee = () => {
		if(!api || !apiReady) return;

		setLoading(true);
		const tx = api.tx.treasury.spend(fundingAmount.toString(), beneficiaryAddress);

		(async () => {
			const info = await tx.paymentInfo(proposerAddress);
			setTxFee(new BN(info.partialFee.toString() || 0));
			setLoading(false);
			setShowAlert(true);
		})();
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debounceTxFn = useCallback(_.debounce(getPreimageTxFee, 2000),[form, proposerAddress, beneficiaryAddress, fundingAmount, api, apiReady, network, selectedTrack, availableBalance]);

	useEffect(() => {
		setShowAlert(false);
		form.validateFields();

		if(isPreimage || !proposerAddress || !beneficiaryAddress || !getEncodedAddress(beneficiaryAddress, network) ||
		!api || !apiReady || !fundingAmount || fundingAmount.lte(ZERO_BN) || fundingAmount.eq(ZERO_BN))return;
		if(!selectedTrack) return;
		debounceTxFn();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounceTxFn]);

	const getState = (api: ApiPromise, proposal: SubmittableExtrinsic<'promise'>): IPreimage => {
		let preimageHash = EMPTY_HASH;
		let encodedProposal: HexString | null = null;
		let preimageLength = 0;
		let notePreimageTx: SubmittableExtrinsic<'promise'> | null = null;
		let storageFee = ZERO_BN;

		encodedProposal = proposal?.method.toHex();
		preimageLength = Math.ceil((encodedProposal?.length - 2) / 2);
		preimageHash = blake2AsHex(encodedProposal);
		notePreimageTx = api.tx.preimage.notePreimage(encodedProposal);

		// we currently don't have a constant exposed, however match to Substrate
		storageFee = ((api.consts.preimage?.baseDeposit || ZERO_BN) as unknown as BN).add(
			((api.consts.preimage?.byteDeposit || ZERO_BN) as unknown as BN).muln(preimageLength)
		);

		return {
			encodedProposal,
			notePreimageTx,
			preimageHash,
			preimageLength,
			storageFee
		};
	};

	const getPreimage = async() => {
		if(!api || !apiReady) return;

		const proposerWallet = localStorage.getItem('treasuryProposalProposerWallet') || '';

		const injectedWindow = window as Window & InjectedWindow;
		const wallet = isWeb3Injected
			? injectedWindow.injectedWeb3[String(proposerWallet)]
			: null;

		if (!wallet) {
			return;
		}

		let injected: Injected | undefined;

		try {
			injected = await new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Wallet Timeout'));
				}, 60000); // wait 60 sec
				if(wallet && wallet.enable) {
					wallet.enable(APPNAME)
						.then((value) => { clearTimeout(timeoutId); resolve(value); })
						.catch((error) => { reject(error); });
				}
			});
		} catch (err) {
			console.log(err?.message);
		}
		if (!injected) {
			return;
		}
		api.setSigner(injected.signer);

		setLoading(true);
		try {

			const proposal = api.tx.treasury.spend(fundingAmount.toString(), beneficiaryAddress);
			const preimage: any = getState(api, proposal);

			const onSuccess = () => {
				queueNotification({
					header: 'Success!',
					message: `Preimage #${proposal.hash} successful.`,
					status: NotificationStatus.SUCCESS
				});
				setPreimage(preimage);
				setPreimageHash(preimage.preimageHash);
				setPreimageLength(preimage.preimageLength);
				setPreimageCreated(true);
				onChangeLocalStorageSet({ preimageCreated: true,  preimageHash: preimage.preimageHash, preimageLength: preimage.preimageLength }, Boolean(isPreimage), true);
				setLoading(false);
				setSteps({ percent: 100, step: 2 });
			};

			const onFailed = () => {
				queueNotification({
					header: 'failed!',
					message: 'Transaction failed!',
					status: NotificationStatus.ERROR
				});
				setLoading(false);
			};
			setLoading(true);

			await executeTx({ address: proposerAddress, api, errorMessageFallback: 'failed.', network, onFailed, onSuccess, tx: preimage?.notePreimageTx });
		}
		catch(error){
			console.log(':( transaction failed');
			console.error('ERROR:', error);
			queueNotification({
				header: 'Failed!',
				message: error.message,
				status: NotificationStatus.ERROR
			});
			setLoading(false);

		}
	};

	const handleSubmit = async() => {

		if(!isPreimage){if(txFee.gte(availableBalance)) return;}
		await form.validateFields();
		isPreimage && onChangeLocalStorageSet({ preimageLinked: true }, Boolean(isPreimage), preimageCreated, true);

		if(!(isPreimage) ? preimageCreated : preimageLinked) {
			setSteps({ percent: 100, step: 2 });
		}
		else{
			!isPreimage ? await getPreimage() : (preimageLength !== 0 && beneficiaryAddress?.length > 0 && fundingAmount.gt(ZERO_BN)) && setSteps({ percent: 100, step: 2 }) ;
			setEnactment({ ...enactment, value: enactment.key === EEnactment.At_Block_No ? advancedDetails?.atBlockNo : advancedDetails?.afterNoOfBlocks  });
		}
	};

	const getExistPreimageDataFromPolkadot = async(preimageHash: string, isPreimage: boolean) => {
		if(!api || !apiReady) return;

		const lengthObj = await api.query.preimage.statusFor(preimageHash);

		const length = JSON.parse(JSON.stringify(lengthObj))?.unrequested?.len || 0;
		checkPreimageHash(length, preimageHash);
		setPreimageLength(length);
		form.setFieldValue('preimage_length', length);
		onChangeLocalStorageSet({ preimageLength: length || '' }, Boolean(isPreimage));

		const preimageRaw: any = await api.query.preimage.preimageFor([preimageHash, length ]);
		const preimage = preimageRaw.unwrapOr(null);

		const constructProposal = function(
			api: ApiPromise,
			bytes: Bytes
		): Proposal | undefined {
			let proposal: Proposal | undefined;

			try {
				proposal = api.registry.createType('Proposal', bytes.toU8a(true));
			} catch (error) {
				console.log(error);
			}

			return proposal;
		};

		try{
			const proposal = constructProposal(api, preimage);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { meta, method, section } = api.registry.findMetaCall(
				proposal?.callIndex as any
			);
			const params = proposal?.meta ? proposal?.meta.args
				.filter(({ type }): boolean => type.toString() !== 'Origin')
				.map(({ name }) => name.toString()) : [];

			const values = proposal?.args;

			const preImageArguments = proposal?.args && params && params.map((name, index) => {
				return {
					name,
					value: values?.[index]?.toString()
				};
			});
			if(preImageArguments){
				const balance = new BN(preImageArguments[0].value || '0') || ZERO_BN;
				setBeneficiaryAddress(preImageArguments[1].value || '');
				setFundingAmount(balance);
				onChangeLocalStorageSet({ beneficiaryAddress: preImageArguments[1].value || '', fundingAmount: balance.toString() }, Boolean(isPreimage));
				setSteps({ percent: 100 ,step: 1 });
				for(const i in maxSpendArr){
					const [maxSpend] = inputToBn(String(maxSpendArr[i].maxSpend), network, false);
					if(maxSpend.gte(balance)){
						setSelectedTrack(maxSpendArr[i].track);
						onChangeLocalStorageSet({ selectedTrack: maxSpendArr[i].track }, Boolean(isPreimage));
						break;
					}
				}

			}
		}catch(error){
			queueNotification({
				header: 'Failed!',
				message: error.message,
				status: NotificationStatus.ERROR
			});
		}
	};

	const existPreimageData = async(preimageHash: string, isPreimage: boolean) => {
		setPreimageLength(0);
		form.setFieldValue('preimage_length', 0);
		if(!api || !apiReady || !isHex(preimageHash, 256) || preimageHash?.length < 0) return;
		setLoading(true);
		const { data, error } = await nextApiClientFetch<IPreimageData>(`api/v1/preimages/latest?hash=${preimageHash}`);
		if(data){
			if(data.hash === preimageHash){
				if(!data.proposedCall.args && !data?.proposedCall?.args?.beneficiary && !data?.proposedCall?.args?.amount){
					getExistPreimageDataFromPolkadot(preimageHash, Boolean(isPreimage));
				}else{
					form.setFieldValue('preimage_length', data?.length);
					setBeneficiaryAddress(data?.proposedCall?.args?.beneficiary || '');
					const balance = new BN(data?.proposedCall?.args?.amount || '0') || ZERO_BN;
					setFundingAmount(balance);
					setPreimageLength(data.length);
					form.setFieldValue('preimage_length', data.length);
					onChangeLocalStorageSet({ beneficiaryAddress: data?.proposedCall?.args?.beneficiary || '', fundingAmount: balance.toString(), preimageLength: data?.length || '' }, Boolean(isPreimage));
					setSteps({ percent: 100 ,step: 1 });
					for(const i in maxSpendArr){
						const [maxSpend] = inputToBn(String(maxSpendArr[i].maxSpend), network, false);
						if(maxSpend.gte(balance)){
							setSelectedTrack(maxSpendArr[i].track);
							onChangeLocalStorageSet({ selectedTrack: maxSpendArr[i].track }, Boolean(isPreimage));
							break;
						}
					}
				}}
		}
		else if(error){
			getExistPreimageDataFromPolkadot(preimageHash, Boolean(isPreimage));
		}
		setLoading(false);
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debounceExistPreimageFn = useCallback(_.debounce(existPreimageData, 2000),[]);

	const handlePreimageHash = (preimageHash: string, isPreimage: boolean) => {
		if( !preimageHash || preimageHash.length === 0 ) return;
		setSteps({ percent: 60, step: 1 });
		debounceExistPreimageFn(preimageHash, isPreimage);
		setPreimageHash(preimageHash);
		onChangeLocalStorageSet({ preimageHash: preimageHash }, Boolean(isPreimage));
		setPreimageCreated(false);
		setPreimageLinked(false);
	};

	const handleAdvanceDetailsChange = (key: EEnactment, value: string) => {
		if(!value || value.includes('-')) return;
		try{
			const bnValue = new BN(value || '0');
			if(!bnValue) return;
			switch (key){
			case EEnactment.At_Block_No:
				setAdvancedDetails({ afterNoOfBlocks:  null, atBlockNo: bnValue });
				break;
			case EEnactment.After_No_Of_Blocks:
				setAdvancedDetails({ afterNoOfBlocks:  bnValue, atBlockNo: null });
				break;
			}
			setEnactment({ ...enactment, value: bnValue });
			onChangeLocalStorageSet({ enactment: { ...enactment, value: bnValue.toString() } }, Boolean(isPreimage));
		}catch(error){
			console.log(error);
		}
		setPreimageCreated(false);
		setPreimageLinked(false);

	};

	const handleBeneficiaryAddresschange = (address: string) => {
		setBeneficiaryAddress(address);
		setPreimageCreated(false);
		setPreimageLinked(false);
		!isPreimage && onChangeLocalStorageSet({ beneficiaryAddress: beneficiaryAddress }, Boolean(isPreimage));
		setSteps({ percent:(fundingAmount.gt(ZERO_BN) && address?.length > 0 )? 100: 60, step: 1 });
		address.length > 0 && (getEncodedAddress(address, network) || Web3.utils.isAddress(address)) && address !== getEncodedAddress(address, network) && setAddressAlert(true);
		setTimeout(() => { setAddressAlert(false);}, 5000);
	};
	const handleOnAvailableBalanceChange = (balanceStr: string) => {
		let balance = ZERO_BN;

		try{
			balance = new BN(balanceStr);
		}
		catch(err){
			console.log(err);
		}
		setAvailableBalance(balance);

	};

	const handleFundingAmountChange = (fundingAmount : BN) => {

		setFundingAmount(fundingAmount);
		setPreimageCreated(false);
		setPreimageLinked(false);
		setSteps({ percent: (beneficiaryAddress?.length > 0 && fundingAmount.gt(ZERO_BN)) ? 100 : 60, step: 1 });
		if(!isAutoSelectTrack || !fundingAmount || fundingAmount.eq(ZERO_BN)) return;
		for(const i in maxSpendArr){
			const [maxSpend] = inputToBn(String(maxSpendArr[i].maxSpend), network, false);
			if(maxSpend.gte(fundingAmount)){
				setSelectedTrack(maxSpendArr[i].track);
				onChangeLocalStorageSet({ selectedTrack: maxSpendArr[i].track }, Boolean(isPreimage));
				break;
			}
		}
	};
	return <Spin spinning={loading} indicator={<LoadingOutlined/>}>
		<div className={`${className} create-preimage`}>
			<div className='my-8 flex flex-col'>
				<label className='text-lightBlue text-sm'>Do you have an existing preimage? </label>
				<Radio.Group onChange={(e) => {
					setIsPreimage(e.target.value);
					onChangeLocalStorageSet({ isPreimage: e.target.value }, e.target.value, preimageCreated, preimageLinked, true);
					setSteps({ percent: 20, step: 1 });}} size='small' className='mt-1.5' value={isPreimage}>
					<Radio value={true} className='text-bodyBlue text-sm font-normal'>Yes</Radio>
					<Radio value={false} className='text-bodyBlue text-sm font-normal'>No</Radio>
				</Radio.Group>
			</div>
			<Form
				form={form}
				disabled={loading}
				onFinish={handleSubmit}
				initialValues={{ address: beneficiaryAddress, after_blocks: String(advancedDetails.afterNoOfBlocks?.toString()), at_block: String(advancedDetails.atBlockNo?.toString()), preimage_hash: preimageHash, preimage_length: preimageLength || 0 }}
				validateMessages= {
					{ required: "Please add the '${name}' " }
				}>
				{isPreimage && <>
					<div className='mt-6 preimage'>
						<label className='text-lightBlue text-sm'>Preimage Hash <span>
							<HelperTooltip text='A unique hash is generate for your preimage and it is used to populate proposal details.' className='ml-1'/>
						</span>
						</label>
						<Form.Item name='preimage_hash'>
							<Input name='preimage_hash' className='h-[40px] rounded-[4px]' value={preimageHash} onChange={(e) => handlePreimageHash(e.target.value, Boolean(isPreimage))}/>
						</Form.Item>
						{invalidPreimageHash () && !loading && <span className='text-[#ff4d4f] text-sm'>Invalid Preimage hash</span>}
					</div>
					<div className='mt-6'>
						<label className='text-lightBlue text-sm'>Preimage Length</label>
						<Form.Item name='preimage_length'>
							<Input name='preimage_length' className='h-[40px] rounded-[4px]' onChange={(e) => {
								setPreimageLength(Number(e.target.value));
								onChangeLocalStorageSet({ preimageLength: e.target.value }, isPreimage);
							}}
							disabled/>
						</Form.Item>
					</div>
				</>
				}
				{ isPreimage === false && <>
					{ (txFee.gte(availableBalance) && !txFee.eq(ZERO_BN)) && <Alert type='info' className={`mt-6 rounded-[4px] text-bodyBlue ${poppins.variable} ${poppins.className}`}showIcon message='Insufficient available balance.'/>}
					<div className='mt-6'>
						<div className='flex justify-between items-center mt-6 text-lightBlue'>
                Proposer Address<span>
								<Balance address={proposerAddress} onChange={handleOnAvailableBalanceChange}/>
							</span>
						</div>
						<div className=' px-2 rounded-[4px] h-[45px] cursor-not-allowed border-solid border-[1px] bg-[#F6F7F9] border-[#D2D8E0] flex items-center'>
							<Address
								address={proposerAddress}
								identiconSize={30}
								disableAddressClick
								addressClassName='text-sm text-bodyBlue text-semibold'
								textClassName='text-bodyBlue font-medium' />
						</div>
					</div>
					<AddressInput
						defaultAddress={beneficiaryAddress}
						label={'Beneficiary Address'}
						placeholder='Add beneficiary address'
						className='text-lightBlue text-sm font-normal'
						onChange={(address) => handleBeneficiaryAddresschange(address)}
						helpText='The amount requested in the proposal will be received in this address.'
						size='large'
						identiconSize={30}
						inputClassName={' font-normal text-sm h-[40px]'}
						skipFormatCheck={true}
						checkValidAddress= {setValidBeneficiaryAddress}
					/>
					{addressAlert && <Alert className='mb mt-2' showIcon message='The substrate address has been changed to Kusama address.'/> }
					<div  className='mt-6 -mb-6'>
						<div className='flex justify-between items-center text-lightBlue text-sm mb-[2px]'>
							<label>Funding Amount <span><HelperTooltip text='Amount requested by the proposer.' className='ml-1'/></span></label>
							<span className='text-xs text-bodyBlue'>Current Value: <span className='text-pink_primary'>{Number(inputAmountValue)*Number(currentTokenPrice.value) || 0} USD</span></span>
						</div>
						<BalanceInput address={proposerAddress} placeholder='Add funding amount' setInputValue={(input: string) => {setInputAmountValue(input); onChangeLocalStorageSet({ fundingAmount: input }, Boolean(isPreimage)); }} formItemName='funding_amount' onChange= { handleFundingAmountChange }/>
					</div>
					<div className='mt-6'>
						<label className='text-lightBlue text-sm'>Select Track <span><HelperTooltip text='Track selection is done based on the amount requested.' className='ml-1'/></span></label>
						<SelectTracks tracksArr={trackArr} onTrackChange={(track) => {setSelectedTrack(track); setIsAutoSelectTrack(false); onChangeLocalStorageSet({ selectedTrack: track }, isPreimage); setSteps({ percent: 100, step: 1 });}} selectedTrack={selectedTrack}/>
					</div>
				</>}
				{ isPreimage !== null  && <div className='mt-6 flex gap-2 items-center cursor-pointer' onClick={() => setOpenAdvanced(!openAdvanced)}>
					<span className='text-pink_primary text-sm font-medium'>Advanced Details</span>
					<DownArrow className='down-icon'/>
				</div>}
				{openAdvanced && <div className='mt-3 flex flex-col preimage'>
					<label className='text-lightBlue text-sm'>Enactment <span><HelperTooltip text='A custom delay can be set for enactment of approved proposals.' className='ml-1'/></span></label>
					<Radio.Group
						className='mt-1 flex flex-col gap-2 enactment'
						value={enactment.key}
						onChange={(e) => {
							setEnactment({ ...enactment, key: e.target.value });
							onChangeLocalStorageSet({ enactment: { key: e.target.value, value: form.getFieldValue(e.target.value === EEnactment.At_Block_No ? 'at_block': 'after_blocks').toString() } }, Boolean(isPreimage));
						}}>
						<Radio value={EEnactment.At_Block_No} className='text-bodyBlue text-sm font-normal'>
							<div className='flex items-center gap-2 h-[40px]'><span className='w-[150px]'>At Block no.<HelperTooltip className='ml-1' text='Allows you to choose a custom block number for enactment.'/></span>
								<span>
									{enactment.key === EEnactment.At_Block_No && <Form.Item name='at_block'
										rules={[
											{
												message:'Invalid Block no.',
												validator(rule, value, callback){
													const bnValue = new BN(Number(value) >= 0 ? value : '0') || ZERO_BN;

													if(callback && value?.length > 0 && ((currentBlock && bnValue?.lt(currentBlock)) || (value?.length && Number(value) <= 0) )){
														callback(rule.message?.toString());
													}else{
														callback();
													}
												} }
										]}>
										<Input  name='at_block' value={String(advancedDetails.atBlockNo?.toString())} className='w-[100px] rounded-[4px]' onChange={(e) => handleAdvanceDetailsChange(EEnactment.At_Block_No, e.target.value)}/>
									</Form.Item>}
								</span>
							</div>
						</Radio>
						<Radio value={EEnactment.After_No_Of_Blocks} className='text-bodyBlue text-sm font-normal'>
							<div className='flex items-center gap-2 h-[30px]'><span className='w-[150px]'>After no. of Blocks<HelperTooltip text='Allows you to choose a custom delay in terms of blocks for enactment.' className='ml-1'/></span>
								<span>{enactment.key === EEnactment.After_No_Of_Blocks && <Form.Item name='after_blocks'
									rules={[
										{
											message:'Invalid no. of Blocks',
											validator(rule, value, callback){
												const bnValue =  new BN(Number(value) >= 0 ? value : '0') || ZERO_BN;
												if(callback &&  value?.length > 0 && (bnValue?.lt(BN_ONE) ||  (value?.length && Number(value) <= 0) )){
													callback(rule.message?.toString());
												}else{
													callback();
												}
											} }
									]}>
									<Input name='after_blocks' className='w-[100px] rounded-[4px]' onChange={(e) => handleAdvanceDetailsChange(EEnactment.At_Block_No, e.target.value)}/>
								</Form.Item>}
								</span>
							</div>
						</Radio>
					</Radio.Group>
				</div>}
				{(showAlert && !isPreimage) && <Alert type='info' className='mt-6 rounded-[4px] text-bodyBlue' showIcon message={`Gas Fees of this ${formatedBalance(String(txFee.toString()), unit)} ${chainProperties[network]?.tokenSymbol} will be applied to create preimage.`}/>}
				<div className='flex justify-end mt-6 -mx-6 border-0 border-solid border-t-[1px] border-[#D2D8E0] px-6 pt-4 gap-4'>
					<Button onClick={() => setSteps({ percent: 100, step: 0 }) } className='font-medium tracking-[0.05em] text-pink_primary border-pink_primary text-sm w-[155px] h-[38px] rounded-[4px]'>Back</Button>
					<Button htmlType='submit'
						className={`bg-pink_primary text-white font-medium text-center tracking-[0.05em] text-sm w-[165px] h-[40px] rounded-[4px] ${((isPreimage !== null && !isPreimage) ? !((beneficiaryAddress && validBeneficiaryAddress) && fundingAmount && selectedTrack && !txFee.gte(availableBalance)) : (preimageHash?.length === 0 || invalidPreimageHash() )) && 'opacity-50' }`}
						disabled={((isPreimage !== null && !isPreimage) ? !((beneficiaryAddress && validBeneficiaryAddress) && fundingAmount && selectedTrack && !txFee.gte(availableBalance)) : (preimageHash?.length === 0 || invalidPreimageHash() ))}>
						{isPreimage ? (preimageLinked ? 'Next' :  'Link Preimage') : (preimageCreated ? 'Next' : 'Create Preimage')}
					</Button>
				</div>
			</Form>
		</div>
	</Spin>;
};
export default styled(CreatePreimage)`
.down-icon{
	filter: brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(7151%) hue-rotate(321deg) brightness(90%) contrast(101%);
}
.preimage .ant-form-item {
  margin-bottom: 0px !important;
}
.enactment .ant-form-item .ant-form-item-control{
flex-direction: row !important;
gap:6px !important;
}
`;