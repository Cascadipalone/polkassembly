// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import { Divider, Switch } from 'antd';
import ExpandIcon from '~assets/icons/expand.svg';
import CollapseIcon from '~assets/icons/collapse.svg';
import OverallPostsNotification from '~assets/icons/gov-icon.svg';
import GroupCheckbox from '../common-ui/GroupCheckbox';
import Root from '~assets/icons/root-open-gov.svg';
import Tips from '~assets/icons/tips.svg';
import Tipper from '~assets/icons/small-tipper.svg';
import Stacking from '~assets/icons/stacking-admin.svg';
import Auction from '~assets/icons/action-admin.svg';
import Referendum from '~assets/icons/referendum-canceller.svg';
import Fellowship from '~assets/icons/fellowship-admin.svg';
import { useNetworkContext } from '~src/context';
import { PostOrigin } from '~src/types';
import { networkTrackInfo } from '~src/global/post_trackInfo';
import { titleMapper } from './utils';
import { ACTIONS } from '../Reducer/action';
import { INotificationObject } from '../types';
import { Collapse } from '../common-ui/Collapse';

const { Panel } = Collapse;
type Props = {
    onSetNotification:  (obj: INotificationObject) => void;
    userNotification:INotificationObject;
    dispatch:  React.Dispatch<any>;
    options: any;
};

// eslint-disable-next-line no-empty-pattern
export default function OpenGovNotification({
	onSetNotification,
	userNotification,
	dispatch,
	options
}: Props) {
	const [active, setActive] = useState<boolean | undefined>(false);
	const { network } = useNetworkContext();
	const [all, setAll] = useState(false);

	const handleAllClick = (checked: boolean) => {
		dispatch({
			payload: {
				params: { checked }
			},
			type: ACTIONS.OPEN_GOV_ALL_CHANGE
		});
		const notification = Object.assign({}, userNotification);
		Object.keys(options).forEach((key) => {
			const id = networkTrackInfo[network][key]?.trackId;
			options[key].forEach((option: any) => {
				if (!option?.triggerName) {
					return;
				}
				let tracks = notification?.[option.triggerName]?.tracks || [];
				if (checked) {
					if (!tracks.includes(id)) tracks.push(id);
				} else {
					tracks = tracks.filter((track: number) => track !== id);
				}
				notification[option.triggerName] = {
					enabled: tracks.length > 0,
					name: option?.triggerPreferencesName,
					tracks
				};
			});
		});
		onSetNotification(notification);
		setAll(checked);
	};

	useEffect(() => {
		const allSelected = Object.values(options).every((option: any) =>
			option.every((item: any) => item.selected)
		);
		setAll(allSelected);
	}, [options]);

	const handleCategoryAllClick = (
		checked: boolean,
		categoryOptions: any,
		title: any
	) => {
		title = titleMapper(title) as string;
		dispatch({
			payload: {
				params: { checked, key: title }
			},
			type: ACTIONS.OPEN_GOV_PROPOSAL_ALL_CHANGE
		});
		const notification = Object.assign({}, userNotification);
		const id = networkTrackInfo[network][title]?.trackId;
		options[title].forEach((option: any) => {
			if (!option?.triggerName) {
				return;
			}
			let tracks = notification?.[option.triggerName]?.tracks || [];
			if (checked) {
				if (!tracks.includes(id)) tracks.push(id);
			} else {
				tracks = tracks.filter((track: number) => track !== id);
			}
			notification[option.triggerName] = {
				enabled: tracks.length > 0,
				name: option?.triggerPreferencesName,
				tracks
			};
		});
		onSetNotification(notification);
	};

	const handleChange = (
		categoryOptions: any,
		checked: boolean,
		value: string,
		title: string
	) => {
		title = titleMapper(title) as string;
		dispatch({
			payload: {
				params: { checked, key: title, value }
			},
			type: ACTIONS.OPEN_GOV_PROPOSAL_SINGLE_CHANGE
		});
		const notification = Object.assign({}, userNotification);
		const id = networkTrackInfo[network][title]?.trackId;
		const option = categoryOptions.find((opt: any) => opt.label === value);
		if (!option?.triggerName) {
			return;
		}
		let tracks = notification?.[option.triggerName]?.tracks || [];
		if (checked) {
			if (!tracks.includes(id)) tracks.push(id);
		} else {
			tracks = tracks.filter((track: number) => track !== id);
		}
		notification[option.triggerName] = {
			enabled: tracks.length > 0,
			name: option?.triggerPreferencesName,
			tracks
		};
		onSetNotification(notification);
	};
	return (
		<Collapse
			size='large'
			className='bg-white'
			expandIconPosition='end'
			expandIcon={({ isActive }) => {
				setActive(isActive);
				return isActive ? <CollapseIcon /> : <ExpandIcon />;
			}}
		>
			<Panel
				header={
					<div className='flex items-center gap-[6px] channel-header'>
						<OverallPostsNotification />
						<h3 className='font-semibold text-[16px] text-[#243A57] md:text-[18px] tracking-wide leading-[21px] mb-0 mt-[2px]'>
                            OpenGov Notifications
						</h3>
						{!!active && (
							<>
								<span className='flex gap-[8px] items-center'>
									<Switch
										size='small'
										id='postParticipated'
										onChange={(checked, e) => {
											e.stopPropagation();
											handleAllClick(checked);
										}}
										checked={all}
									/>
									<p className='m-0 text-[#485F7D]'>All</p>
								</span>
							</>
						)}
					</div>
				}
				key='1'
			>
				<div className='flex flex-col'>
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.ROOT]}
							title='Root'
							classname='md:basis-[50%]'
							Icon={Root}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.SMALL_TIPPER]}
							title='Small Tipper'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Tipper}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-2' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.STAKING_ADMIN]}
							title='Staking Admin'
							classname='md:basis-[50%]'
							Icon={Stacking}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.BIG_TIPPER]}
							title='Big Tipper'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Tipper}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-2' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.AUCTION_ADMIN]}
							title='Auction Admin'
							classname='md:basis-[50%]'
							Icon={Auction}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.SMALL_SPENDER]}
							title='Small Spender'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Tipper}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-[2px]' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.TREASURER]}
							title='Treasurer'
							classname='md:basis-[50%]'
							Icon={Tips}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.MEDIUM_SPENDER]}
							title='Medium Spender'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Tipper}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-[2px]' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={
								options[PostOrigin.REFERENDUM_CANCELLER]
							}
							title='Referendum Canceler'
							classname='md:basis-[50%]'
							Icon={Referendum}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.BIG_SPENDER]}
							title='Big Spender'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Tipper}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-[2px]' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={
								options[PostOrigin.REFERENDUM_KILLER]
							}
							title='Referendum Killer'
							classname='md:basis-[50%]'
							Icon={Referendum}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={
								options[PostOrigin.FELLOWSHIP_ADMIN]
							}
							title='Fellowship Admin'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Fellowship}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-[2px]' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.LEASE_ADMIN]}
							title='Lease Admin'
							classname='md:basis-[50%]'
							Icon={Referendum}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={options[PostOrigin.GENERAL_ADMIN]}
							title='General Admin'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Referendum}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
					<Divider className='border-[#D2D8E0] border-[2px]' dashed />
					<div className='flex flex-wrap'>
						<GroupCheckbox
							categoryOptions={options[PostOrigin.MEMBERS]}
							title='Member Referenda'
							classname='md:basis-[50%]'
							Icon={Fellowship}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
						<Divider className='border-[#D2D8E0] border-[2px] md:hidden' dashed />
						<GroupCheckbox
							categoryOptions={

								options[PostOrigin.WHITELISTED_CALLER]
							}
							title='Whitelisted Caller'
							classname='md:border-dashed md:border-x-0 md:border-y-0 md:border-l-2 md:border-[#D2D8E0] md:pl-[48px]'
							Icon={Fellowship}
							onChange={handleChange}
							handleCategoryAllClick={handleCategoryAllClick}
						/>
					</div>
				</div>
			</Panel>
		</Collapse>
	);
}
