// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
// SPDX-License-Identifier: Apache-2.0
// Do not edit, auto-generated by @polkadot/apps-config
import type { OverrideBundleType } from '@polkadot/types/types';
/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable sort-keys */
export const typesBundleGenshiro = {
	spec: {
		Genshiro: {
			instances: {
				balances: ['Eq', 'Eth', 'Btc', 'Eos', 'Dot', 'Crv', 'Usd']
			},
			types: [
				{
					minmax: [0, null],
					types: {
						AccountInfo: {
							nonce: 'Index',
							consumers: 'RefCount',
							providers: 'RefCount'
						},
						Address: 'AccountId',
						AmmPool: {
							_enum: {
								Curve: 'PoolId',
								Yield: 'PoolId'
							}
						},
						Asset: {
							'0': 'AssetIdInnerType'
						},
						AssetData: {
							id: 'Asset',
							lot: 'FixedU128',
							price_step: 'FixedU128',
							maker_fee: 'FixedU128',
							taker_fee: 'FixedU128',
							multi_asset: 'Option<MultiAsset>',
							multi_location: 'Option<MultiLocation>',
							debt_weight: 'DebtWeightType',
							buyout_priority: 'u64',
							asset_type: 'AssetType',
							is_dex_enabled: 'bool',
							collateral_enabled: 'bool'
						},
						AssetId: 'Asset',
						AssetIdInnerType: 'u64',
						AssetMetrics: {
							period_start: 'Duration',
							period_end: 'Duration',
							returns: 'Vec<FixedNumber>',
							volatility: 'FixedNumber',
							correlations: 'Vec<(Asset, FixedNumber)>'
						},
						AssetName: 'Vec<u8>',
						AssetType: {
							_enum: {
								Native: null,
								Physical: null,
								Synthetic: null,
								Lp: 'AmmPool'
							}
						},
						Balance: 'u64',
						BalanceOf: 'Balance',
						BalancesAggregate: {
							total_issuance: 'Balance',
							total_debt: 'Balance'
						},
						BestPrice: {
							ask: 'Option<FixedI64>',
							bid: 'Option<FixedI64>'
						},
						BinaryId: 'u64',
						BinaryInfo: {
							start_time: 'u64',
							end_time: 'u64',
							proper: 'Asset',
							minimal_amount: 'Balance',
							target: '(Asset, BinaryMode)',
							total: '(Balance, Balance)',
							claimed: 'Balance'
						},
						BinaryMode: {
							_enum: {
								CallPut: 'FixedI64',
								InOut: '(FixedI64, FixedI64)'
							}
						},
						BlockNumber: 'u64',
						CapVec: {
							head_index: 'u32',
							len_cap: 'u32',
							items: 'Vec<FixedNumber>'
						},
						ChainId: 'u8',
						Currency: {
							_enum: [
								'UNKNOWN',
								'Eqd',
								'Eq',
								'Eth',
								'Btc',
								'Eos',
								'Dot',
								'Crv'
							]
						},
						ChunkKey: 'u64',
						DataPoint: {
							price: 'u64',
							account_id: 'AccountId',
							block_number: 'BlockNumber',
							timestamp: 'u64'
						},
						DebtWeightType: 'i128',
						DebtWeightTypeInner: 'i128',
						DepositNonce: 'u64',
						Duration: {
							secs: 'u64',
							nanos: 'u32'
						},
						EpochCounter: 'u64',
						EpochInfo: {
							counter: 'EpochCounter',
							started_at: 'Timestamp',
							duration: 'Timestamp',
							new_duration: 'Option<Timestamp>'
						},
						FinancialMetrics: {
							period_start: 'Duration',
							period_end: 'Duration',
							assets: 'Vec<Asset>',
							mean_returns: 'Vec<FixedNumber>',
							volatilities: 'Vec<FixedNumber>',
							correlations: 'Vec<FixedNumber>',
							covariances: 'Vec<FixedNumber>'
						},
						FinancialRecalcPeriodMs: 'u64',
						FixedI64: 'i64',
						FixedNumber: 'u128',
						FixedU128: 'u128',
						Keys: 'SessionKeys3',
						LenderInfo: {
							deposit: 'Balance',
							pending_withdrawals: 'PendingWithdrawal'
						},
						LookupSource: 'AccountId',
						MarginState: {
							_enum: {
								Good: null,
								SubGood: null,
								MaintenanceStart: 'u64',
								MaintenanceIsGoing: 'u64',
								MaintenanceTimeOver: 'u64',
								MaintenanceEnd: null,
								SubCritical: null
							}
						},
						MaxCountOfAssetsRecalcPerBlock: 'i32',
						MmId: 'u16',
						MmInfo: {
							weight: 'Perbill',
							borrowed: 'Balance'
						},
						MmPoolInfo: {
							account_id: 'AccountId',
							min_amount: 'Balance',
							total_staked: 'Balance',
							total_deposit: 'Balance',
							total_borrowed: 'Balance',
							total_pending_withdrawals: 'PendingWithdrawal'
						},
						Number: 'FixedU128',
						OperationRequestLiqFm: {
							authority_index: 'AuthIndex',
							validators_len: 'u32',
							block_num: 'BlockNumber'
						},
						OperationRequest: {
							account: 'AccountId',
							authority_index: 'AuthIndex',
							validators_len: 'u32',
							block_num: 'BlockNumber',
							higher_priority: 'bool'
						},
						OperationRequestDexDeleteOrder: {
							asset: 'Asset',
							order_id: 'OrderId',
							price: 'FixedI64',
							who: 'AccountId',
							buyout: 'Option<Balance>',
							authority_index: 'AuthIndex',
							validators_len: 'u32',
							block_num: 'BlockNumber'
						},
						Order: {
							order_id: 'OrderId',
							account_id: 'AccountId',
							side: 'OrderSide',
							price: 'FixedI64',
							amount: 'FixedU128',
							created_at: 'u64',
							expiration_time: 'u64'
						},
						OrderType: {
							_enum: {
								Limit: {
									price: 'FixedI64',
									expiration_time: 'u64'
								},
								Market: null
							}
						},
						OrderId: 'u64',
						OrderSide: {
							_enum: ['Buy', 'Sell']
						},
						PendingWithdrawal: {
							last_epoch: 'EpochCounter',
							available: 'Balance',
							available_next_epoch: 'Balance',
							requested: 'Balance'
						},
						PoolId: 'u32',
						PoolInfo: {
							owner: 'AccountId',
							pool_asset: 'AssetId',
							assets: 'Vec<AssetId>',
							amplification: 'Number',
							fee: 'Permill',
							admin_fee: 'Permill',
							balances: 'Vec<Balance>',
							total_balances: 'Vec<Balance>'
						},
						PoolTokenIndex: 'u32',
						PortfolioMetrics: {
							period_start: 'Duration',
							period_end: 'Duration',
							z_score: 'u32',
							volatility: 'FixedNumber',
							value_at_risk: 'FixedNumber'
						},
						Price: 'u128',
						PriceLog: {
							latest_timestamp: 'Duration',
							prices: 'CapVec<Price>'
						},
						PricePayload: {
							public: '[u8; 33]',
							asset: 'Asset',
							price: 'FixedI64',
							block_number: 'BlockNumber'
						},
						PricePeriod: {
							_enum: ['Min', 'TenMin', 'Hour', 'FourHour', 'Day']
						},
						PricePoint: {
							block_number: 'BlockNumber',
							timestamp: 'u64',
							last_fin_recalc_timestamp: 'Timestamp',
							price: 'u64',
							data_points: 'Vec<DataPoint>'
						},
						PriceUpdate: {
							period_start: 'Duration',
							time: 'Duration',
							price: 'FixedNumber'
						},
						ProposalStatus: {
							_enum: ['Initiated', 'Approved', 'Rejected']
						},
						ProposalVotes: {
							votes_for: 'Vec<AccountId>',
							votes_against: 'Vec<AccountId>',
							status: 'ProposalStatus',
							expiry: 'BlockNumber'
						},
						ResourceId: '[u8; 32]',
						Round: {
							total_cap: 'Balance',
							individual_cap: 'Balance',
							end: 'u64',
							token: 'Asset',
							minimal_buy_amount: 'Balance',
							vesting_params: 'VestingParams'
						},
						Signature: 'u32',
						SignedBalance: {
							_enum: {
								Positive: 'Balance',
								Negative: 'Balance'
							}
						},
						SubAccType: {
							_enum: ['Bailsman', 'Borrower', 'Lender']
						},
						Timestamp: 'u64',
						TotalAggregates: {
							collateral: 'Balance',
							debt: 'Balance'
						},
						TransferReason: {
							_enum: [
								'Common',
								'InterestFee',
								'MarginCall',
								'LiquidityFarming',
								'BailsmenRedistribution',
								'TreasuryEqBuyout',
								'TreasuryBuyEq',
								'Subaccount',
								'Lock',
								'Unlock',
								'Claim',
								'CurveFeeWithdraw',
								'Reserve',
								'Unreserve'
							]
						},
						UserGroup: {
							_enum: [
								'UNKNOWN',
								'Balances',
								'Bailsmen',
								'Borrowers',
								'Lenders'
							]
						},
						UnsignedPriorityPair: '(u64, u64)',
						VestingInfo: {
							locked: 'Balance',
							perBlock: 'Balance',
							startingBlock: 'BlockNumber'
						},
						VestingParams: {
							blocks_until_beginning: 'u64',
							amount_of_blocks: 'u64'
						},
						XdotNumber: 'u128',
						XdotPoolInfo: {
							pool_asset: 'AssetId',
							lp_total_supply: 'Balance',
							account: 'AccountId',
							base_asset: 'AssetId',
							xbase_asset: 'AssetId',
							g1: 'XdotNumber',
							g2: 'XdotNumber',
							maturity: 'u64',
							ts: 'XdotNumber'
						},
						LockPeriod: {
							_enum: ['None', 'ThreeMonth', 'SixMonth', 'Year']
						},
						DispatchErrorModule: 'DispatchErrorModuleU8'
					}
				}
			]
		}
	}
} as unknown as OverrideBundleType;
