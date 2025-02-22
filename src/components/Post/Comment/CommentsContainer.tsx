// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Alert, Anchor, Empty, Tooltip } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { FC, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useCommentDataContext, useNetworkContext, usePostDataContext } from '~src/context';
import { ProposalType } from '~src/global/proposalType';

import PostCommentForm from '../PostCommentForm';
import Comments from './Comments';
import RefendaLoginPrompts from '~src/ui-components/ReferendaLoginPrompts';
import Image from 'next/image';
import UnfilterAgainstIcon from '~assets/overall-sentiment/against.svg';
import UnfilterSlightlyAgainstIcon from '~assets/overall-sentiment/slightly-against.svg';
import UnfilterNeutralIcon from '~assets/overall-sentiment/neutral.svg';
import UnfilterSlightlyForIcon from '~assets/overall-sentiment/slightly-for.svg';
import UnfilterForIcon from '~assets/overall-sentiment/for.svg';
import AgainstIcon from '~assets/overall-sentiment/pink-against.svg';
import SlightlyAgainstIcon from '~assets/overall-sentiment/pink-slightly-against.svg';
import NeutralIcon from '~assets/overall-sentiment/pink-neutral.svg';
import SlightlyForIcon from '~assets/overall-sentiment/pink-slightly-for.svg';
import ForIcon from '~assets/overall-sentiment/pink-for.svg';
import { ESentiments } from '~src/types';
import { IComment } from './Comment';
import Loader from '~src/ui-components/Loader';
import { useRouter } from 'next/router';
import { getAllCommentsByTimeline } from './utils/getAllCommentsByTimeline';

const { Link: AnchorLink } = Anchor;

export function getStatus(type: string) {
	if (['DemocracyProposal'].includes(type)) {
		return 'Democracy Proposal';
	} else if ('TechCommitteeProposal' === type) {
		return 'Tech Committee Proposal';
	} else if ('TreasuryProposal' === type) {
		return 'Treasury Proposal';
	} else if (['Referendum', 'FellowshipReferendum', 'ReferendumV2'].includes(type)) {
		return 'Referendum';
	} else if (type === 'CouncilMotion') {
		return 'Motion';
	} else if (type === 'ChildBounty') {
		return 'Child Bounty';
	} else if (['Discussions', 'Grants'].includes(type)) {
		return type.substring(0, type.length - 1);
	}
	return type;
}

interface ICommentsContainerProps {
	className?: string;
	id: number | null | undefined;
}

export interface ITimeline {
	date: Dayjs;
	status: string;
	id: number;
	commentsCount: number;
	firstCommentId: string;
	index: string;
	type: string;
}

interface ISentimentsPercentage {
	against: ESentiments | 0;
	for: ESentiments | 0;
	neutral: ESentiments | 0;
	slightlyAgainst: ESentiments | 0;
	slightlyFor: ESentiments | 0;
}

const getSortedComments = (comments: {[index:string]:Array<IComment>}) => {
	const commentResponse:any = {};
	for(const key in comments){
		commentResponse[key] = comments[key].sort((a, b) => (dayjs(a.created_at).diff(dayjs(b.created_at))));
	}
	return commentResponse;
};

const CommentsContainer: FC<ICommentsContainerProps> = (props) => {
	const { className, id } = props;
	const { postData: { postType, timeline, created_at } } = usePostDataContext();
	const targetOffset = 10;
	const {
		comments,
		setComments,
		setTimelines,
		timelines,
		overallSentiments
	} = useCommentDataContext();
	const isGrantClosed: boolean = Boolean(postType === ProposalType.GRANTS && created_at && dayjs(created_at).isBefore(dayjs().subtract(6, 'days')));
	const [openLoginModal, setOpenLoginModal] = useState<boolean>(false);
	const [showOverallSentiment, setShowOverallSentiment] = useState<boolean>(true);
	const [sentimentsPercentage, setSentimentsPercentage] = useState<ISentimentsPercentage>({ against: 0, for: 0, neutral: 0, slightlyAgainst: 0, slightlyFor: 0 });
	const [loading, setLoading] = useState(true);
	const { network } = useNetworkContext();
	const [filterSentiments, setFilterSentiments] = useState<ESentiments|null>(null);
	const router = useRouter();
	let allComments = Object.values(comments)?.flat() || [];
	const allCommentsLength = timelines.reduce((a, b) => a + b.commentsCount, 0);

	if(filterSentiments){
		allComments = allComments.filter((comment) => comment?.sentiment === filterSentiments);
	}

	const handleTimelineClick = (e: React.MouseEvent<HTMLElement>, link: { title: React.ReactNode; href: string; }) => {
		if (link.href === '#') {
			e.preventDefault();
			return;
		}
	};

	const getOverallSentimentPercentage = () => {
		const againstCount = overallSentiments?.[ESentiments.Against] || 0;
		const slightlyAgainstCount = overallSentiments?.[ESentiments.SlightlyAgainst] || 0;
		const neutralCount = overallSentiments?.[ESentiments.Neutral] || 0;
		const slightlyForCount = overallSentiments?.[ESentiments.SlightlyFor] || 0;
		const forCount = overallSentiments?.[ESentiments.For] || 0;

		const totalCount = againstCount + slightlyAgainstCount + neutralCount + slightlyForCount + forCount;

		setSentimentsPercentage({
			against: Number(Math.round(againstCount / totalCount * 100)) || 0,
			for: Number(Math.round(forCount / totalCount * 100)) || 0,
			neutral: Number(Math.round(neutralCount / totalCount * 100)) || 0,
			slightlyAgainst: Number(Math.round(slightlyAgainstCount / totalCount * 100)) || 0,
			slightlyFor: Number(Math.round(slightlyForCount / totalCount * 100)) || 0
		});

		allComments?.length === 0 ? setShowOverallSentiment(false) : setShowOverallSentiment(true);
		if (againstCount === 0 && slightlyAgainstCount === 0 && neutralCount === 0 && slightlyForCount === 0 && forCount === 0) { setShowOverallSentiment(false); } else { setShowOverallSentiment(true); }

	};

	const getFilteredComments = (sentiment: number) => {
		setFilterSentiments(filterSentiments === sentiment ? null:sentiment);
	};

	const checkActive = (sentiment: ESentiments) => {
		return filterSentiments === sentiment;
	};

	useEffect(() => {
		getOverallSentimentPercentage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [comments]);

	const addCommentDataToTimeline = async () => {
		if(!timeline){
			setLoading(false);
			return;
		}
		const timelines:ITimeline[] = [];
		const comments:{[index:string]:IComment[]} ={};
		let haveComments: number = 0;
		if (timeline && timeline.length > 0) {
			timeline.forEach((obj) => {
				haveComments +=obj.commentsCount;
				timelines.push({
					commentsCount: obj.commentsCount,
					date: dayjs(obj?.created_at),
					firstCommentId: '',
					id: timelines.length + 1,
					index: obj?.index?.toString(),
					status: getStatus(obj?.type),
					type:obj?.type
				});
				comments[`${obj?.index?.toString()}_${obj?.type}`] = [];
			});
			setTimelines(timelines);
		}
		if(!haveComments){
			setLoading(false);
			return;
		}
		const commentResponse = await getAllCommentsByTimeline(timeline, network);

		if(!commentResponse || Object.keys(commentResponse).length==0){
			setComments(comments);
		}
		else{
			setComments(getSortedComments(commentResponse.comments));
		}
		if(loading){
			setLoading(false);
		}
	};

	const handleCurrentCommentAndTimeline = (postId:string, type:string, comment:IComment) => {
		const key = `${postId}_${type}`;
		const commentsPayload = {
			...comments,
			[key]:[
				...comments[key],
				comment
			]
		};
		setComments(getSortedComments(commentsPayload));
		const timelinePayload = timelines.map((timeline) => (
			timeline.index === postId ?
				{ ...timeline,commentsCount:timeline.commentsCount+1 } :
				timeline
		));
		setTimelines(timelinePayload);
		router.push(`#${comment.id}`);
	};

	useEffect(() => {
		if(!timeline || timeline.length == 0){
			return;
		}
		addCommentDataToTimeline();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[timeline]);

	return (
		<div className={className}>
			{id ? <>
				{isGrantClosed ?
					<Alert message="Grant closed, no comments can be added or edited." type="info" showIcon /> :
					<PostCommentForm className='mb-8' setCurrentState={handleCurrentCommentAndTimeline}/>
				}
			</>
				: <div className="mt-4 mb-8 bg-[#E6F4FF] rounded-[6px] shadow-md h-12 flex justify-center items-center gap-3">
					<Image src="/assets/icons/alert-login.svg" width={20} height={20} alt={''} />
					<div className="text-sm font-medium text-bodyBlue">
						Please <span className="cursor-pointer text-pink_primary" onClick={() => { setOpenLoginModal(true); }}>Log In</span> to comment
					</div>
				</div>
			}
			<div className='mb-5 flex justify-between items-center tooltip-design max-sm:flex-col max-sm:items-start max-sm:gap-1'>
				<span className='text-lg font-medium text-bodyBlue'>
					{allCommentsLength || 0}
					<span className='ml-1'>Comments</span>
				</span>
				{showOverallSentiment && <div className='flex gap-2 max-sm:gap-[2px] max-sm:-ml-2 '>
					<Tooltip color='#E5007A'
						title={<div className='flex flex-col text-xs px-1'>
							<span className='text-center font-medium'>Completely Against</span>
							<span className='text-center pt-1'>Select to filter</span>
						</div>} >
						<div onClick={() => { getFilteredComments(ESentiments.Against); }} className={`p-1 flex gap-1 cursor-pointer text-xs items-center hover:bg-[#FEF2F8] rounded-[4px] ${checkActive(ESentiments.Against) && 'bg-[#FEF2F8] text-pink_primary'} ${loading ? 'pointer-events-none cursor-not-allowed opacity-50':''}`} >
							{checkActive(ESentiments.Against) ? <AgainstIcon /> : <UnfilterAgainstIcon />}
							<span className={'flex justify-center font-medium'}>{sentimentsPercentage?.against}%</span>
						</div>
					</Tooltip>
					<Tooltip color='#E5007A' title={<div className='flex flex-col text-xs px-1'>
						<span className='text-center font-medium'>Slightly Against</span>
						<span className='text-center pt-1'>Select to filter</span>
					</div>}>
						<div onClick={() => { getFilteredComments(ESentiments.SlightlyAgainst); }} className={`p-[3.17px] flex gap-[3.46px] cursor-pointer text-xs items-center hover:bg-[#FEF2F8] rounded-[4px] ${checkActive(ESentiments.SlightlyAgainst) && 'bg-[#FEF2F8] text-pink_primary'} ${loading ? 'pointer-events-none cursor-not-allowed opacity-50':''}`}>
							{checkActive(ESentiments.SlightlyAgainst) ? <SlightlyAgainstIcon /> : <UnfilterSlightlyAgainstIcon />}
							<span className={'flex justify-center font-medium'}>{sentimentsPercentage?.slightlyAgainst}%</span>
						</div>
					</Tooltip>
					<Tooltip color='#E5007A' title={<div className='flex flex-col text-xs px-1'>
						<span className='text-center font-medium'>Neutral </span>
						<span className='text-center pt-1'>Select to filter</span>
					</div>}>
						<div onClick={() => { getFilteredComments(ESentiments.Neutral); }} className={`p-[3.17px] flex gap-[3.46px] cursor-pointer text-xs items-center hover:bg-[#FEF2F8] rounded-[4px] ${checkActive(ESentiments.Neutral) && 'bg-[#FEF2F8] text-pink_primary'} ${loading ? 'pointer-events-none cursor-not-allowed opacity-50':''}`}>
							{checkActive(ESentiments.Neutral) ? <NeutralIcon className='text-[20px] font-medium' /> : <UnfilterNeutralIcon />}
							<span className={'flex justify-center font-medium'}>{sentimentsPercentage?.neutral}%</span>
						</div>
					</Tooltip>
					<Tooltip color='#E5007A' title={<div className='flex flex-col text-xs px-1'>
						<span className='text-center font-medium'>Slightly For</span>
						<span className='text-center pt-1'>Select to filter</span>
					</div>}>
						<div onClick={() => { getFilteredComments(ESentiments.SlightlyFor); }} className={`p-[3.17px] flex gap-[3.46px] cursor-pointer text-xs items-center hover:bg-[#FEF2F8] rounded-[4px] ${checkActive(ESentiments.SlightlyFor) && 'bg-[#FEF2F8] text-pink_primary'} ${loading ? 'pointer-events-none cursor-not-allowed opacity-50':''}`}>
							{checkActive(ESentiments.SlightlyFor) ? <SlightlyForIcon /> : <UnfilterSlightlyForIcon />}
							<span className={'flex justify-center font-medium'}>{sentimentsPercentage?.slightlyFor}%</span>
						</div>
					</Tooltip>
					<Tooltip color='#E5007A' title={<div className='flex flex-col text-xs px-1'>
						<span className='text-center font-medium'>Completely For</span>
						<span className='text-center pt-1'> Select to filter</span>
					</div>}>
						<div onClick={() => { getFilteredComments(ESentiments.For); }} className={`p-[3.17px] flex gap-[3.46px] cursor-pointer text-xs items-center hover:bg-[#FEF2F8] rounded-[4px] ${checkActive(ESentiments.For) && 'bg-[#FEF2F8] text-pink_primary'} ${loading ? 'pointer-events-none cursor-not-allowed opacity-50':''}`}>
							{checkActive(ESentiments.For) ? <ForIcon /> : <UnfilterForIcon />}
							<span className={'flex justify-center font-medium'}>{sentimentsPercentage?.for}%</span>
						</div>
					</Tooltip>
				</div>}
			</div>
			<div className={'block xl:grid grid-cols-12'}>
				{
					!!allComments?.length && timelines.length >= 1 &&
					<div className='hidden h-min xl:block col-start-1 col-end-2 min-w-[100px] sticky top-[110px] ml-1 mb-[65px]'>
						<Anchor targetOffset={targetOffset} className='h-full min-w-[140px]' onClick={handleTimelineClick}>
							{timelines.map((timeline) => {
								return (
									timeline.commentsCount > 0 ?
										<div key={id} className='m-0 p-0 border-none [&>.ant-card-body]:p-0'>
											{comments[`${timeline.index}_${timeline.type}`]?.[0]?.id ? <AnchorLink
												href={`#${comments[`${timeline.index}_${timeline.type}`]?.[0]?.id}`}
												title={
													<div className='flex flex-col text-lightBlue sticky top-10'>
														<div className='text-xs mb-1'>{timeline.date.format('MMM Do')}</div>
														<div className='mb-1 font-medium break-words whitespace-pre-wrap'>{timeline.status}</div>
														<div className='text-xs'>({timeline.commentsCount})</div>
													</div>
												}
											/>:
												<div className='flex flex-col text-lightBlue ml-5 cursor-pointer sticky top-10'>
													<div className='text-xs mb-1'>{timeline.date.format('MMM Do')}</div>
													<div className='mb-1 font-medium break-words whitespace-pre-wrap'>{timeline.status}</div>
													<div className='text-xs'>({timeline.commentsCount})</div>
												</div>
											}
										</div>
										:
										<div key={timeline.id} className='flex flex-col ml-5 cursor-default text-lightBlue sticky top-10'>
											<div className='text-xs mb-1'>{timeline.date.format('MMM Do')}</div>
											<div className='mb-1 font-medium break-words whitespace-pre-wrap'>{timeline.status}</div>
											<div className='text-xs'>({timeline.commentsCount})</div>
										</div>
								);
							})}
						</Anchor>
					</div>
				}
				<div className={`col-start-1 ${timelines.length >= 1 && 'xl:col-start-3'} col-end-13 mt-0`}>
					{!!allComments?.length && !loading &&
						<>
							<Comments disableEdit={isGrantClosed} comments={allComments} />
						</>
					}
					{loading && <Loader/>}
					{allComments.length === 0 && allComments.length > 0 && <div className='mt-4 mb-4'>
						<Empty description='No comments available' />
					</div>}
					{
						<RefendaLoginPrompts
							modalOpen={openLoginModal}
							setModalOpen={setOpenLoginModal}
							image="/assets/post-comment.png"
							title="Join Polkassembly to Comment on this proposal."
							subtitle="Discuss, contribute and get regular updates from Polkassembly."
						/>
					}
				</div>
			</div>
		</div>
	);
};

// @ts-ignore
export default React.memo(styled(CommentsContainer)`
.ant-anchor-wrapper {
	.ant-anchor {
		display: flex;
		flex-direction: column;
		gap: 96px;
	}

	.ant-anchor-ink {
		margin-left: 5px;
	}

	.ant-anchor-link {
		margin-left: 5px;
	}

	.ant-anchor-ink-ball-visible {
		display: block !important;
		background: url('/assets/pa-small-circle.png') !important;
		background-repeat: no-repeat !important;
		background-position: center !important;
		height: 18px !important;
		width: 18px !important;
		border: none !important;
		border-radius: 50% !important;
		margin-left: -7px;
	}
	.my-alert .ant-alert-message span {
  		color: red !important;
	}
}
`);