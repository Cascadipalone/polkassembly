// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { LinkOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React, { FC } from 'react';
import { ProfileDetails } from '~src/auth/types';
import { socialLinks } from './Details';
import { SocialIcon } from '~src/ui-components/SocialLinks';

interface ISocialsProps {
    loading: boolean;
    setProfile: React.Dispatch<React.SetStateAction<ProfileDetails>>
    profile: ProfileDetails;
}

const Socials: FC<ISocialsProps> = (props) => {
	const { loading, profile, setProfile } = props;
	return (
		<div className='max-h-[552px] flex flex-col gap-y-4'>
			{
				socialLinks.map((socialLink) => {
					const strLink = socialLink.toString();
					return (
						<article key={strLink}>
							<label
								className='flex items-center gap-x-[6px] text-base cursor-pointer font-normal text-[#485F7D]'
								htmlFor={strLink}
							>
								<SocialIcon type={socialLink} />
								<span>
									{strLink}
								</span>
							</label>
							<Input
								className='rounded-[4px] border border-solid border-[rgba(72,95,125,0.2)] text-[#1D2632] h-10'
								size='large'
								type='url'
								prefix={<LinkOutlined className='text-[rgba(72,95,125,0.2)] mr-1.5 text-base' />}
								placeholder={`Enter ${strLink} ${strLink === 'Email'? '': 'URL'}`}
								onChange={(e) => {
									const value = e.target.value;
									setProfile((prev) => {
										let isUpdated = false;
										const social_links = prev?.social_links?.map((link) => {
											if (link.type === strLink) {
												isUpdated = true;
												return {
													...link,
													link: value
												};
											}
											return {
												...link
											};
										}) || [];
										if (!isUpdated) {
											social_links.push({
												link: value,
												type: socialLink
											});
										}
										return {
											...prev,
											social_links
										};
									});
								}}
								value={profile?.social_links?.find((link) => link.type === strLink)?.link}
								disabled={loading}
							/>
						</article>
					);
				})
			}
		</div>
	);
};

export default Socials;