// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/* eslint-disable sort-keys */
import { Tabs } from 'antd';
import { IReferendumV2PostsByStatus } from 'pages/root';
import React from 'react';
import CountBadgePill from '~src/ui-components/CountBadgePill';

import TrackListingAllTabContent from './TrackListingAllTabContent';
import TrackListingStatusTabContent from './TrackListingStatusTabContent';
import FilterByTags from '~src/ui-components/FilterByTags';
import FilteredTags from '~src/ui-components/filteredTags';

interface Props {
	className?: string;
	posts: IReferendumV2PostsByStatus;
	trackName: string;
}

export enum CustomStatus {
	Submitted = 'CustomStatusSubmitted',
	Voting = 'CustomStatusVoting',
	Closed = 'CustomStatusClosed'
}

const TrackListingCard = ({ className, posts, trackName } : Props) => {

	const items = [
		{
			label: <CountBadgePill label='All' count={posts?.all?.data?.count || 0} />,
			key: 'All',
			children: <TrackListingAllTabContent
				posts={posts?.all?.data?.posts || []}
				error={posts?.all?.error}
			/>
		},
		{
			label: <CountBadgePill label='Submitted' count={posts?.submitted?.data?.count || 0} />,
			key: 'Submitted',
			children: <TrackListingStatusTabContent
				posts={posts?.submitted?.data?.posts || []}
				error={posts?.submitted?.error}
				trackName={trackName}
				status={CustomStatus.Submitted} />
		},
		{
			label: <CountBadgePill label='Voting' count={posts?.voting?.data?.count || 0} />,
			key: 'Voting',
			children: <TrackListingStatusTabContent
				posts={posts?.voting?.data?.posts || []}
				error={posts?.voting?.error}
				trackName={trackName}
				status={CustomStatus.Voting}
			/>
		},
		{
			label: <CountBadgePill label='Closed' count={posts?.closed?.data?.count || 0} />,
			key: 'Closed',
			children: <TrackListingStatusTabContent
				posts={posts?.closed?.data?.posts || []}
				error={posts?.closed?.error}
				trackName={trackName}
				status={CustomStatus.Closed}
			/>
		}
	];

	return (
		<div className={`${className} bg-white drop-shadow-md rounded-[14px] p-4 md:p-0 text-sidebarBlue `}>
			<div className='flex items-center justify-between mb-10 h-[59px]'>
				<div>
					<FilteredTags/>
				</div>
				<FilterByTags className='mr-[25px]'/>
			</div>
			<Tabs
				items={items}
				type="card"
				className='ant-tabs-tab-bg-white text-sidebarBlue font-medium mt-[-70px]'
			/>
		</div>
	);
};

export default TrackListingCard;