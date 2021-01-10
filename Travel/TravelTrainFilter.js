import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import { black, blue, grey, softgrey } from '../../libs/Constants';
import SpaceBetween from '../../components/SpaceBetween'
import Waktu from '../../libs/Waktu';
import AutoHeightImage from 'react-native-auto-height-image';
import Button from '../../components/Button';
import { uniqBy } from 'lodash';
import { popScreen, isIphoneXorAbove } from '../../libs/navigation';

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
			Schedules: props.Schedules,
			activeIndex: 0,
			Options: [],
			isCheckedAll: [
				true,
				true,
				[
					true,
					true,
				],
				true,
				true
			],
			menu: [{
				text: 'Waktu Pergi',
				active: true,
				hide: false
			}, {
				text: 'Kelas',
				active: false,
				hide: false
			}, {
				text: 'Stasiun',
				active: false,
				hide: false
			}, {
				text: 'Kereta',
				active: false,
				hide: false
			}, {
				text: 'Rentang Harga',
				active: false,
				hide: false
			}]
		}
	}

	componentDidMount() {
		let { Schedules, Options, isCheckedAll, menu } = this.state
		let { Origin, Destination } = this.props
		let TimeRange, Price, Classes, Trains, Stations = []
		if (this.props.FilterOptions) {
			Options = this.props.FilterOptions
			for(let i = 0; i < 5 ; ++i){
				if(i != 2) isCheckedAll = this.checkAll(Options, i, isCheckedAll)
			}
			for(let i = 0; i < 2; ++i){
				isCheckedAll = this.nestedCheckAll(Options, 2, isCheckedAll, i)
			}
		}
		else {
			TimeRange = [{
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
			Price = [{
				checked: true,
				text: 'Kurang dari 150.000',
				leastAmount: 0,
				maxAmount: 150000
			}, {
				checked: true,
				text: '150.001 - 300.000',
				leastAmount: 150001,
				maxAmount: 300000
			}, {
				checked: true,
				text: '300.001 - 450.000',
				leastAmount: 300001,
				maxAmount: 450000
			}, {
				checked: true,
				text: 'Diatas 450.001',
				leastAmount: 450001,
				maxAmount: 999999999
			}]
			Classes = uniqBy(Schedules.map(a => ({ text: a.wagonclasscodefull, checked: true })), 'text')
			Trains = uniqBy(Schedules.map(a => ({ text: a.trainname, checked: true })), 'text')
			
			if(Origin.Type == 'City'){
				let list = uniqBy(Schedules.map(a => ({ text: `${a.stasiunorgname} (${a.stasiunorgcode})`, checked: true, code: a.stasiunorgcode})), 'code')
				Stations.push(list)
			}
			if(Destination.Type == 'City'){
				let list = uniqBy(Schedules.map(a => ({ text: `${a.stasiundestname} (${a.stasiundestcode})`, checked: true, code: a.stasiundestcode})), 'code')
				Stations.push(list)
			}
			if(Origin.Type != 'City' && Destination.Type != 'City'){
				menu[2].hide = true
			}

			Options = [TimeRange, Classes, Stations, Trains, Price]
		}
		this.setState({ Options, menu })
	}

	onFilter = (reset = false) => {
		let { Options, Schedules } = this.state
		let { onSave } = this.props
		let clone = Schedules
		let minFilter = true

		if (!reset) {
			let classes = Options[1].map((d, i) => {
				if (d.checked) {
					return d.text
				}
			}) // Kelas
			let trains = Options[3].map((d, i) => {
				if (d.checked) {
					return d.text
				}
			}) // Kereta

			clone = Schedules.filter(t => classes.includes(t.wagonclasscodefull)).filter(t => trains.includes(t.trainname))

			Options[0].forEach((w, i) => {
				if (!w.checked) {
					let earliest = w.earliest.replace(':', '')
					let latest = w.latest.replace(':', '')
					clone = clone.filter((o) => !( (Number(Waktu(o.departdatetime)) >= Number(earliest))  && (Number(Waktu(o.departdatetime)) <= Number(latest))  ))
				}
			}) // Waktu

			Options[2].forEach((options, i) => { //Stasiun
				options.forEach((a, j) => { //List stasiun
					if(!a.checked){
						if(i == 0){
							clone = clone.filter((o) => !(a.code == o.stasiunorgcode))
						}
						else if(i == 1){
							clone = clone.filter((o) => !(a.code == o.stasiundestcode))
						}
					}
				})
			})

			Options[4].forEach((option,i) => {
				if (i > 0 && option.checked) {
					minFilter = false
				}
			})

			Options[4].forEach((w, i) => { 
				if(!w.checked && !minFilter)
					clone = clone.filter((o) => !( ( (Number(o.fares[0].amount)) >= w.leastAmount ) && ( (Number(o.fares[0].amount)) <= w.maxAmount ) ))
				else if(w.checked && minFilter)
					clone = clone.filter((o) => ( ( (Number(o.fares[0].amount)) >= w.leastAmount ) && ( (Number(o.fares[0].amount)) <= w.maxAmount ) ))
			}) // Harga

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
		let { Options, menu, activeIndex, isCheckedAll } = this.state
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
							Options[activeIndex] ? (
								<View>
									{
										activeIndex != 2 ? (
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
												<View style={styles.container}>
													<Text style={[styles.bold, { padding: 12 }]}>{i == 0 ? 'Asal' : 'Tujuan'}</Text>
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
															<Text style={styles.textSmall} numberOfLines={1}>{a.text}</Text>
															<Checkmark onPress={() => this.onCheckmark(i)} checked={a.checked} />
														</SpaceBetween>
													</View>
												</TouchableWithoutFeedback>
											)
										))
									}
								</View>
							) : null
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
	bold: {
		fontWeight: 'bold'
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