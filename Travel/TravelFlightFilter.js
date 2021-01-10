import React, { Component } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, TouchableOpacity, SafeAreaView, TouchableWithoutFeedback, TextInput } from 'react-native';
import { black, blue, grey, softgrey } from '../../libs/Constants';
import SpaceBetween from '../../components/SpaceBetween'
import Waktu from '../../libs/Waktu';
import { compact } from 'lodash';
import AutoHeightImage from 'react-native-auto-height-image';
import Button from '../../components/Button';
import { uniqBy } from 'lodash';
import { popScreen, isIphoneXorAbove } from '../../libs/navigation';
import { TRAVEL_SOFT_GREY, textStyles, marginStyles } from '../../libs/Travel/TravelConstants';

const width = Dimensions.get('window').width

export default class extends Component {
	static options() {
		return {
			topBar: {
				background: {
					color: '#E3E3E3'
				},
				title: {
					text: 'Filter',
					alignment: 'center',
					fontWeight: 'bold',
				}
			}
		}
	}

	constructor(props) {
		super(props);
		this.state = {
			activeIndex: 0,
			Options: [],
			flightNoQuery: '',
			isCheckedAll: [
				true,
				true,
				true,
				[
					true,
					true,
				],
				[
					true,
					true,
				],
				true
			],
			menu: [{
				text: 'No. Penerbangan',
				active: true,
				hide: false
			}, {
				text: 'Harga',
				active: false,
				hide: false
			}, {
				text: 'Transit',
				active: false,
				hide: false
			}, {
				text: 'Waktu',
				active: false,
				hide: false
			}, {
				text: 'Bandara',
				active: false,
				hide: false
			}, {
				text: 'Maskapai',
				active: false,
				hide: false
			}]
		}
	}

	componentDidMount() {
		let { Options, isCheckedAll, menu } = this.state
		let { selectedTab, Schedules, Origin, Destination } = this.props
		if (this.props.FilterOptions) {
			Options = this.props.FilterOptions
			for(let i = 1; i <= 5 ; ++i){
				if(i != 3 && i != 4) isCheckedAll = this.checkAll(Options, i, isCheckedAll)
			}
			for(let i = 0; i < 2; ++i){
				isCheckedAll = this.nestedCheckAll(Options, 3, isCheckedAll, i)
				isCheckedAll = this.nestedCheckAll(Options, 4, isCheckedAll, i)
			}
		}
		else {
			let Price, Transits, TimeRange, Carriers
			let Airports = []
			Price = [{
				checked: true,
				text: 'Kurang dari 1.000.000',
				leastAmount: 0,
				maxAmount: 1000000
			}, {
				checked: true,
				text: '1.000.001 - 2.000.000',
				leastAmount: 150001,
				maxAmount: 2000000
			}, {
				checked: true,
				text: '2.000.001 - 3.000.000',
				leastAmount: 2000001,
				maxAmount: 3000000
			}, {
				checked: true,
				text: 'Lebih dari 3.000.001',
				leastAmount: 3000001,
				maxAmount: 999999999
			}]
			Transits = [
				{
					checked: true,
					text: '0',
					count: 0
				},
				{
					checked: true,
					text: '1',
					count: 1
				},
				{
					checked: true,
					text: '2',
					count: 2
				},
				{
					checked: true,
					text: '3+',
					count: 3
				},
			]
			TimeRange = [
				[{
					checked: true,
					text: '00:00-05:59',
					earliest: '00:00',
					latest: '05:59'
				}, {
					checked: true,
					text: '06:00-11:59',
					earliest: '06:00',
					latest: '11:59'
				}, {
					checked: true,
					text: '12:00-17:59',
					earliest: '12:00',
					latest: '17:59'
				}, {
					checked: true,
					text: '18:00-23:59',
					earliest: '18:00',
					latest: '23:59'
				}],[{
					checked: true,
					text: '00:00-05:59',
					earliest: '00:00',
					latest: '05:59'
				}, {
					checked: true,
					text: '06:00-11:59',
					earliest: '06:00',
					latest: '11:59'
				}, {
					checked: true,
					text: '12:00-17:59',
					earliest: '12:00',
					latest: '17:59'
				}, {
					checked: true,
					text: '18:00-23:59',
					earliest: '18:00',
					latest: '23:59'
				}]
			]
			let Departs = uniqBy(Schedules.map(a => ({ text: a.flights[0].depDetail.name, code: a.flights[0].depDetail.code, checked: true })), 'code')
			let Arrivals = uniqBy(Schedules.map(a => ({ text: a.flights[a.flights.length-1].arrDetail.name, code: a.flights[a.flights.length-1].arrDetail.code, checked: true })), 'code')
			Airports.push(Departs, Arrivals)
			Carriers = uniqBy(Schedules.map(a => ({ text: a.flights[0].carrier.name, code: a.flights[0].carrier.code, iconUrl: a.flights[0].carrier.iconUrl , checked: true })), 'code')
			Options = ['', Price, Transits, TimeRange, Airports, Carriers]
		}
		this.setState({ Options, menu })
	}

	onFilter = (reset = false) => {
		let { Options, flightNoQuery } = this.state
		let { onSave, Schedules } = this.props
		let clone = Schedules
		let minFilter = true

		if (!reset) {
			let DepartAirports = [], ReturnAirports = [], Carriers = []
			DepartAirports = Options[4][0].map((d, i) => {
				if (d.checked) return d.code
			}) // Bandara Berangkat
			ReturnAirports = Options[4][1].map((d, i) => {
				if(d.checked) return d.code
			})
			Carriers = Options[5].map((d, i) => {
				if (d.checked) return d.code
			}) // Maskapai

			DepartAirports = compact(DepartAirports)
			ReturnAirports = compact(ReturnAirports)
			Carriers = compact(Carriers)

			clone = Schedules.filter(t => DepartAirports.map(e => e.includes(t.flights[0].depDetail.code)))
					.filter(t => ReturnAirports.map(e => e.includes(t.flights[t.flights.length - 1].arrDetail.code)))
					.filter(t => t.flights.map((flightDetail) => Carriers.includes(flightDetail.carrier.code))[0])

			clone = clone.filter(t => t.flights.map((flightDetail) => {
				let flightNo = flightDetail.carrier.code + '-' + flightDetail.flightNo
				return flightNo.includes(flightNoQuery)
			})[0])

			Options[3][0].forEach((w, i) => {
				if (!w.checked) {
					let earliest = w.earliest.replace(':', '')
					let latest = w.latest.replace(':', '')
					clone = clone.filter((o) => !( (Number(Waktu(o.flights[0].depDetail.time)) >= Number(earliest))  && (Number(Waktu(o.flights[0].depDetail.time)) <= Number(latest))  ))
				}
			}) // Waktu Keberangkatan

			Options[3][1].forEach((w, i) => {
				if (!w.checked) {
					let earliest = w.earliest.replace(':', '')
					let latest = w.latest.replace(':', '')
					clone = clone.filter((o) => !( (Number(Waktu(o.flights[0].arrDetail.time)) >= Number(earliest))  && (Number(Waktu(o.flights[0].arrDetail.time)) <= Number(latest))  ))
				}
			}) // Waktu Kedatangan

			Options[4].forEach((options, i) => { // Airports
				options.forEach((a, j) => { //ListAirports
					if(!a.checked){
						clone = i == 0 ? 
						clone.filter((o) => {
							return !(o.flights[0].depDetail.code == a.code) 
						}) : clone.filter((o) => {
							return !(o.flights[o.flights.length-1].arrDetail.code == a.code) 
						})
					}
				})
			})

			Options[1].forEach((option,i) => {
				if (i > 0 && option.checked) {
					minFilter = false
				}
			})

			Options[1].forEach((w, i) => { 
				if(!w.checked && !minFilter)
					clone = clone.filter((o) => !( ( (Number(o.fares.paxFares.adt.total.amount)) >= w.leastAmount ) && ( (Number(o.fares.paxFares.adt.total.amount)) <= w.maxAmount ) ))
				else if(w.checked && minFilter)
					clone = clone.filter((o) => ( ( (Number(o.fares.paxFares.adt.total.amount)) >= w.leastAmount ) && ( (Number(o.fares.paxFares.adt.total.amount)) <= w.maxAmount ) ))
			}) // Harga

			Options[2].forEach((w, i) => {
				if(!w.checked){
					clone = clone.filter((o) => !(w.count == (o.flights.length - 1)))
				}
				// else if(w.checked){
				// 	clone = clone.filter((o) => w.count == (o.flights.length - 1))
				// }
			}) // Transit
		}

		let obj = reset ?
			{ FilteredSchedules: null, FilterOptions: null, notfound: false }
			: { FilteredSchedules: clone, FilterOptions: Options, notfound: clone.length <= 0 ? true : false }
		onSave(obj)
	}

	checkAll(Options, activeIndex, isCheckedAll) {
		isCheckedAll[activeIndex] = true
		Options[activeIndex]
			.filter((item) => {
				if (!item.checked) {
					isCheckedAll[activeIndex] = false
				}
			})
		return isCheckedAll
	}

	nestedCheckAll(Options, activeIndex, isCheckedAll, i) {
		isCheckedAll[activeIndex][i] = true
		Options[activeIndex][i] ? 
		Options[activeIndex][i]
			.filter((item) => {
				if (!item.checked) {
					isCheckedAll[activeIndex][i] = false
				}
			}) : null
		return isCheckedAll
	}

	onCheckmark = (i) => {
		let { activeIndex, Options, isCheckedAll } = this.state
		if (i == 'all') {
			if(isCheckedAll[activeIndex]){
				isCheckedAll[activeIndex] = false
				Options[activeIndex].forEach((item, i) => {
					item.checked = false
				})
			}
			else{
				isCheckedAll[activeIndex] = true
				Options[activeIndex].forEach((item, i) => {
					item.checked = true
				})
			}
		}
		else {
			Options[activeIndex][i].checked = !Options[activeIndex][i].checked
			isCheckedAll = this.checkAll(Options, activeIndex, isCheckedAll)
		}
		this.setState({ Options, isCheckedAll })
	}

	onNestedCheckmark = (i, j) => {
		let { activeIndex, Options, isCheckedAll } = this.state
		if (j == 'all') {
			if(isCheckedAll[activeIndex][i]){ //checked
				isCheckedAll[activeIndex][i] = false
				Options[activeIndex][i].forEach((item, i) => {
					item.checked = false
				})
			}
			else{
				isCheckedAll[activeIndex][i] = true
				Options[activeIndex][i].forEach((item, i) => {
					item.checked = true
				})
			}
		}
		else {
			Options[activeIndex][i][j].checked = !Options[activeIndex][i][j].checked
			isCheckedAll = this.nestedCheckAll(Options, activeIndex, isCheckedAll, i)
		}
		this.setState({ Options, isCheckedAll })
	}

	switchOptions = (selectedIndex) => {
		let { menu, activeIndex } = this.state
		menu[activeIndex].active = false
		menu[selectedIndex].active = true
		this.setState({ menu, activeIndex: selectedIndex })
	}

	render() {
		let { Options, menu, activeIndex, isCheckedAll, flightNoQuery } = this.state
		return (
			<SafeAreaView style={{ flex: 1, width: width }}>
				<View style={{ flex: 1, flexDirection: 'row' }}>
					<View style={{ flex: 4, backgroundColor: softgrey }}>
						{menu.map((a, i) => (
							!a.hide ? (
								<TouchableOpacity onPress={() => this.switchOptions(i)} key={i} style={{ padding: 12, backgroundColor: a.active ? 'white' : softgrey }}>
									<Text style={{ color: a.active ? black : grey, fontWeight: a.active ? 'bold' : 'normal', fontSize: 13 }}>
										{a.text}
									</Text>
								</TouchableOpacity>
							) : null
						))}
					</View>

					<View style={{ flex: 6, backgroundColor: 'white' }}>
						{
							Options[activeIndex] && activeIndex != 0 ? (
								<View>
									{
										activeIndex != 3 && activeIndex != 4 ? (
											<TouchableWithoutFeedback onPress={() => this.onCheckmark('all')}>
												<View>
													<SpaceBetween style={styles.item}>
														<Text style={styles.textSmall} numberOfLines={1}>Pilih Semua</Text>
														<Checkmark onPress={() => this.onCheckmark('all')} checked={isCheckedAll[activeIndex]} />
													</SpaceBetween>
												</View>
											</TouchableWithoutFeedback>
										) : null
									}
									{
										Options[activeIndex].map((a, i) => (
											Array.isArray(a) ? (
												<View>
													<Text style={[textStyles.bold, { padding: 12 }]}>{i == 0 ? 'Keberangkatan' : 'Kedatangan'}</Text>
													<TouchableWithoutFeedback onPress={() => this.onNestedCheckmark(i, 'all')}>
														<View>
															<SpaceBetween style={styles.item}>
																<Text style={styles.textSmall} numberOfLines={1}>Pilih Semua</Text>
																<Checkmark onPress={() => this.onNestedCheckmark(i, 'all')} checked={isCheckedAll[activeIndex][i]} />
															</SpaceBetween>
														</View>
													</TouchableWithoutFeedback>
													{
														a.map((b, j) => (
															<TouchableWithoutFeedback onPress={() => this.onNestedCheckmark(i,j)}>
																<View>
																	<SpaceBetween key={j} style={[styles.item, styles.nested]}>
																		<Text style={styles.textSmall} numberOfLines={1}>{b.text}</Text>
																		<Checkmark onPress={() => this.onNestedCheckmark(i,j)} checked={b.checked} />
																	</SpaceBetween>
																</View>
															</TouchableWithoutFeedback>
														))
													}
												</View>
											) : (
												<TouchableWithoutFeedback onPress={() => this.onCheckmark(i)}>
													<View>
														<SpaceBetween key={i} style={styles.item}>
															<View style={{flexDirection: 'row', alignContent: 'center'}}>
																{
																	activeIndex == 5 ? (
																		<AutoHeightImage
																			width={20}
																			source={{uri: a.iconUrl}}
																			style={{ marginRight: 7 }} />
																		) : null
																}
																<Text style={styles.textSmall} numberOfLines={1}>{a.text}</Text>
															</View>
															<Checkmark onPress={() => this.onCheckmark(i)} checked={a.checked} />
														</SpaceBetween>
													</View>
												</TouchableWithoutFeedback>
											)
										))
									}
								</View>
							) : ( // nomor penerbangan
								<View style={styles.container}>
									<Text style={[textStyles.bold, marginStyles.bottomLarge]}>Masukkan No. Penerbangan</Text>
									<TextInput
										value={flightNoQuery}
										autoCapitalize={'characters'}
										onChangeText={(value) => this.setState({ flightNoQuery: value })}
										style={{ borderWidth: 1, borderColor: TRAVEL_SOFT_GREY, padding: 5, paddingVertical: 7 }}
										placeholder={'Contoh: 123 atau GA-123'}/>
								</View>
							)
						}
					</View>
				</View>

				<View style={{ flexDirection: 'row', position: 'absolute', bottom: 0, right: 0, left: 0 }}>
					<View style={{ flex: 4 }}>
						<Button
							text={'Reset'}
							transparent={true}
							style={{ backgroundColor: softgrey, paddingBottom: isIphoneXorAbove() ? 25 : 0 }}
							color={blue}
							onPress={() => {
								this.onFilter(true)
								popScreen(this.props.componentId)
							}}
						/>
					</View>

					<View style={{ flex: 6 }}>
						<Button
							text={'Terapkan Filter'}
							style={{ backgroundColor: blue, borderRadius: 0, paddingBottom: isIphoneXorAbove() ? 25 : null }}
							onPress={() => {
								this.onFilter(false)
								popScreen(this.props.componentId)
							}}
						/>
					</View>
				</View>
			</SafeAreaView>
		);
	}
}

let Checkmark = ({ checked, onPress }) => (
	<TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 5, borderWidth: 1, borderColor: 'lightgrey', backgroundColor: 'white', padding: 2, height: 20, width: 20 }}>
		<View style={{ alignItems: 'center' }}>
			{checked ?
				<AutoHeightImage
					width={14}
					source={require('../../assets/travel/Check-green.png')} /> : null
			}
		</View>
	</TouchableOpacity>
)

const styles = StyleSheet.create({
	container: {
		padding: 12
	},
	textSmall: {
		fontSize: 13,
	},
	grey: {
		color: grey
	},
	item: {
		alignItems: 'center',
		padding: 12,
		paddingRight: 20
	},
	nested: {
		paddingLeft: 24
	}
});