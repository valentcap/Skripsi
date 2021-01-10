import { isEmpty } from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import AutoHeightImage from 'react-native-auto-height-image';
import Dash from 'react-native-dash';
import { Navigation } from 'react-native-navigation';
import SpaceBetween from '../../components/SpaceBetween';
import Button from '../../components/Travel/Button';
import { softgrey } from '../../libs/Constants';
import { popScreen } from '../../libs/navigation';
import Rupiah from '../../libs/Rupiah';
import { layoutStyles, marginStyles, textStyles, TRAVEL_BLUE, SCREEN_WIDTH } from '../../libs/Travel/TravelConstants';

export default class extends Component {
	static options(passProps) {
		return {
			topBar: {
				title: {
					component: {
						name: 'TravelFlightDetailTitle',
						alignment: 'fill',
						passProps: {
							name: passProps.isMultiCarrier ? 'Multi-Maskapai' : passProps.flights[0].carrier.name,
							origin: passProps.flights[0].depDetail.code,
							destination: passProps.flights[passProps.flights.length-1].arrDetail.code,
							date: passProps.flights[0].depDetail.time,
						}
					}
				},
				elevation: 0
			}
		}
	}


	constructor(props){
		super(props);
		this.state = {
			isActive: true
		}
		Navigation.events().bindComponent(this)
	}

	selectTicket() { 
		this.props.selectTicket()
		popScreen(this.props.componentId)
	}

	render() {
		let { isActive } = this.state
		let { flights, isMultiCarrier, fares, source, seatsLeft } = this.props
		let { amenities } = flights[0]
		let flightNo = []
		let carriers = []
		flights.forEach(e => flightNo.push(e.flightNo))
		flights.forEach(e => carriers.push(e.carrier))
		let onSwitch = (isActive) => {
			this.setState({ isActive })
		}

		return (
			<SafeAreaView style={[layoutStyles.safearea, { backgroundColor: softgrey }]}>
				<SpaceBetween>
					<TouchableOpacity
						style={[
							styles.navigationTab,
							isActive ? styles.navigationtabActive : null
						]}
						onPress={() => onSwitch(true)}>
						<Text style={isActive ? [styles.navigationtabActive, { borderBottomWidth: 0 }] : textStyles.grey}>
							Detail Perjalanan
						</Text>
					</TouchableOpacity>
					{
						source == 'form' ? null : (
							<TouchableOpacity
								style={[
									styles.navigationTab,
									isActive ? null : styles.navigationtabActive
								]}
								onPress={() => onSwitch(false)}>
								<Text style={isActive ? textStyles.grey : [styles.navigationtabActive, { borderBottomWidth: 0 }]}>
									Detail Harga
								</Text>
							</TouchableOpacity>
						)
					}
				</SpaceBetween>
				<ScrollView showsVerticalScrollIndicator={false} bounces={false}>
					<View style={[layoutStyles.card, { margin: 20, marginVertical: 20 }]}>
						<View style={[marginStyles.item, marginStyles.bottomLarge]}>
							<SpaceBetween>
								<View style={layoutStyles.row}>
									<AutoHeightImage
										width={50}
										source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : {uri: carriers[0].iconUrl}} />
										<View style={{ marginLeft: 5 }}>
											<Text style={[textStyles.bold, textStyles.medium]}>{isMultiCarrier ? 'Multi-Maskapai' : carriers[0].name}</Text>
											<View style={layoutStyles.rowCenterVertical}>
											{
												carriers.map((carrier, i) => {
													return (
														<Text style={[textStyles.xSmall, textStyles.grey]}>{`${carrier.code}-${flightNo[i]}${i < carriers.length-1 ? ', ' : ''}`}</Text>
													)
												})
											}
											</View>
										</View>
								</View>

								<AutoHeightImage
									width={20}
									style={{ tintColor: 'grey' }}
									source={require('../../assets/travel/Plane-grey.png')} />
							</SpaceBetween>
						</View>
						{
							isActive ? (
								<View>
									{
										flights.map((flight, i) => {
											let { depDetail, arrDetail, flyTime, layover, carrier, flightNo } = flight
											return (
												<View>
													<View style={layoutStyles.row}>
														<View style={{ flex: 3, marginRight: 10 }}>
															<View>
																<Text style={[textStyles.xSmall, textStyles.alignRight]}>{moment(depDetail.time).locale('id').format('HH:mm')}</Text>
																<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{`${moment(depDetail.time).locale('id').format('DD MMM YYYY')}`}</Text>
															</View>

															<View style={{ marginTop: 30 }}>
																<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{moment.utc().startOf('day').add({ minutes: flyTime }).format('HH[j] mm[m]')}</Text>
															</View>

															<View style={{ marginTop: 27 }}>
																<Text style={[textStyles.xSmall, textStyles.alignRight]}>{moment(arrDetail.time).locale('id').format('HH:mm')}</Text>
																<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{`${moment(arrDetail.time).locale('id').format('DD MMM YYYY')}`}</Text>
															</View>
														</View>

														<View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
															<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: 'grey', backgroundColor: 'white', zIndex: 1 }} />
															<View style={{ borderLeftWidth: 1, borderLeftColor: 'grey', height: 100}} />
															<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: TRAVEL_BLUE, backgroundColor: TRAVEL_BLUE, zIndex: 1 }} />
														</View>

														<View style={{ flex: 6, justifyContent: 'flex-start', marginLeft: 10 }}>
															<View>
																<Text style={[textStyles.xSmall]}>{`${depDetail.city} (${depDetail.code})`}</Text>
																<Text style={[textStyles.xSmall, textStyles.grey]}>{depDetail.name}</Text>
															</View>

															{
																flights.length > 1 ? (
																	<View style={[layoutStyles.rowCenterVertical, { marginTop: 30 }]}>
																		<View style={{ marginRight: 5 }}>
																			<Text style={[textStyles.xSmall]}>{`${carrier.name}`}</Text>
																			<Text style={[textStyles.xSmall, textStyles.alignLeft, textStyles.grey]}>{`${carrier.code}-${flightNo}`}</Text>
																		</View>
																		<AutoHeightImage
																			width={40}
																			source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : {uri: carriers[0].iconUrl}} />
																	</View>
																) : null
															}

															<View style={{ marginTop: flights.length > 1 ? 27 : 70 }}>
																<Text style={[textStyles.xSmall]}>{`${arrDetail.city} (${arrDetail.code})`}</Text>
																<Text style={[textStyles.xSmall, textStyles.grey]}>{arrDetail.name}</Text>
															</View>
														</View>
													</View>
													{
														i < flights.length-1 ? (
															<View style={[layoutStyles.rowCenterVertical, marginStyles.paddingSmall, marginStyles.itemLarge, { backgroundColor: softgrey, width: SCREEN_WIDTH / 3, marginLeft: SCREEN_WIDTH/8 }]}>
																<Image style={{ marginEnd: 10, overflow: 'visible', width: 15, height: 15 }} source={require('../../assets/travel/Timer-blue.png')}/>
																<Text style={[textStyles.small, textStyles.black]}>Transit {moment.utc().startOf('day').add({ minutes: layover }).format('hh[j] m[m]')}</Text>
															</View>
														) : null
													}
												</View>
											)
										})
									}
									<View style={[layoutStyles.row, { alignSelf: 'flex-start', marginTop: 20 }]}>
										<AutoHeightImage
											width={20}
											style={{ tintColor: 'grey' }}
											source={require('../../assets/travel/Baggage.png')} />
										<Text style={[textStyles.grey, marginStyles.itemHorizontalLarge]}>Bagasi kabin</Text> 
										<Text style={[textStyles.black]}>{amenities.baggage.cabin.adt.desc}</Text>
									</View>
								</View>
							) : (
								<View style={marginStyles.itemLarge}>
									<SpaceBetween style={marginStyles.item}>
										<Text style={[textStyles.small]}>Harga Tiket Dewasa (x{'1'}) :</Text>
										<Text style={[textStyles.small, textStyles.bold]}>{Rupiah(fares.paxFares.adt.total.amount)}</Text>
									</SpaceBetween>
									{
										!isEmpty(fares.paxFares.chd) ? (
											<SpaceBetween style={marginStyles.item}>
												<Text style={[textStyles.small]}>Harga Tiket Anak (x{'1'}) :</Text>
												<Text style={[textStyles.small, textStyles.bold]}>{Rupiah(fares.paxFares.chd.total.amount)}</Text>
											</SpaceBetween>
										) : null
									}
									{
										!isEmpty(fares.paxFares.inf) ? (
											<SpaceBetween style={marginStyles.item}>
												<Text style={[textStyles.small]}>Harga Tiket Bayi (x{'1'}) :</Text>
												<Text style={[textStyles.small, textStyles.bold]}>{Rupiah(fares.paxFares.inf.total.amount)}</Text>
											</SpaceBetween>
										) : null
									}
									<SpaceBetween style={marginStyles.item}>
										<Text style={[textStyles.small, textStyles.grey]}>Pajak :</Text>
										<Text style={[textStyles.small, textStyles.grey]}>Termasuk</Text>
									</SpaceBetween>
									<Dash style={[marginStyles.item, { height: .5 }]} dashGap={6} dashLength={5} dashColor={'darkgrey'} dashThickness={1} />
									<SpaceBetween style={marginStyles.item}>
										<Text style={[textStyles.xLarge, textStyles.black, textStyles.bold]}>Total Pembayaran</Text>
										<Text style={[textStyles.xLarge, textStyles.orange, textStyles.bold]}>{Rupiah(fares.totalFare.total.amount)}</Text>
									</SpaceBetween>
								</View>
							)
						}
					</View>
					{
						this.props.index == 'selected' ? null : (
							<SpaceBetween style={[marginStyles.itemLarge, marginStyles.paddingSmall, marginStyles.paddingHorizontalxLarge, { backgroundColor: 'white' }]}>
								{
									isActive ? (
										<Text style={[textStyles.bold, textStyles.orange, textStyles.xLarge]}>{Rupiah(fares.paxFares.adt.total.amount)}<Text style={[textStyles.medium, textStyles.grey]}>/org</Text></Text>
									) : (
										<Text style={[textStyles.bold, textStyles.orange, textStyles.xLarge]}>{Rupiah(fares.totalFare.total.amount)}</Text>
									)
								}
								{
									seatsLeft > 0 ? <Button
										style={{ backgroundColor: TRAVEL_BLUE, paddingHorizontal: 20 }}
										text="Pesan"
										bold
										onPress={() => this.selectTicket()}>
									</Button>
									:
									<Button
										style={{ backgroundColor: 'grey', paddingHorizontal: 20 }}
										text="Pesan"
										bold
										onPress={() => null}>
									</Button>
								}
							</SpaceBetween> 
						)	
					}
				</ScrollView>
			</SafeAreaView>
		)
	}
}

const styles = StyleSheet.create({
	navigationTab: {
		flex: 1,
		padding: 15,
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center",
	},
	navigationtabActive: {
		borderBottomWidth: 2,
		borderBottomColor: TRAVEL_BLUE,
		color: TRAVEL_BLUE,
		backgroundColor: 'white'
	},
});