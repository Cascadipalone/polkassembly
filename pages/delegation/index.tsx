// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { GetServerSideProps } from 'next';
import React, { useEffect } from 'react';
import { getNetworkFromReqHeaders } from '~src/api-utils';
import DelegationDashboard from '~src/components/DelegationDashboard';

import { useNetworkContext } from '~src/context';
import SEOHead from '~src/global/SEOHead';

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
	const network = getNetworkFromReqHeaders(req.headers);
	return { props: { network } };
};

const Delegation = ( props : { network: string} ) => {

	const { setNetwork } = useNetworkContext();

	useEffect(() => {
		setNetwork(props.network);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <>
		<SEOHead title='Delegation Dashboard' network={props.network} />
		<DelegationDashboard/>
	</>;
};

export default Delegation ;