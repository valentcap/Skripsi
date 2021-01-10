import { orderBy, groupBy, isEmpty } from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback, ScrollView } from 'react-native';
import AutoHeightImage from 'react-native-auto-height-image';
import Modal from 'react-native-modal';
import SpaceBetween from '../../components/SpaceBetween';
import Button from '../../components/Travel/Button';
import TravelLoading from '../../components/TravelLoading';
import { travelAPI } from '../../libs/api';
import { black, blue, orange, softgrey, yellow } from '../../libs/Constants';
import Rupiah from '../../libs/Rupiah';
import { layoutStyles, marginStyles, modalStyles, SCREEN_HEIGHT, SCREEN_WIDTH, searchResultStyles, textStyles, TRAVEL_BLUE, TRAVEL_LIGHT_ORANGE, TRAVEL_ORANGE, TRAVEL_API_URL } from '../../libs/Travel/TravelConstants';
import Waktu from '../../libs/Waktu';
import { pushScreen } from '../../libs/navigation';

const interval = (SCREEN_WIDTH - Math.ceil(SCREEN_WIDTH/1.5) + 10)
const MAX_PASSENGERS = 9

export default class extends Component {
	constructor(props) {
		super(props);
		this.state = {
            Adult: props.Passengers.Adult,
            Child: 0,
			Infant: 0,
			dateList: [],
			Schedules: [],
			DepartSchedules: [],
			ReturnSchedules: [],
			SelectedTicket: null,

			isLoading: true,
			isLowestPriceLoading: true,
			isDomestic: true,
			showErrorPassenger: false,
			showPassengerCategoryChange: false,
			showSortModal: false,
			showChangeDateModal: false,

			changeDateIndex: 0,
			lowestPrice: 0,
			
			SortOptions: [
				{
					selected: true,
					label: 'Harga termurah',
					content: 0,
					sortBy: 'fares.paxFares.adt.total.amount'
				},
				{
					selected: false,
					label: 'Keberangkatan paling awal',
					content: '05:45',
					sortBy: 'flights[0].depDetail.time'
				},
				{
					selected: false,
					label: 'Durasi tercepat',
					content: '5j 45m',
					sortBy: 'journeyInfo[0].journeyTime'
				}
			]
		}
		this.scrollView = undefined
	}

	componentDidUpdate(prevProps){
		let { Itinerary } = this.props	
		if((this.props.step != prevProps.step) && (this.props.ReturnTicket == prevProps.ReturnTicket) && (this.props.ReturnTrip)) {
			if(this.props.step == 2) {
				this.prepareOptions(this.state.ReturnSchedules)
				this.setState({ Schedules: this.state.ReturnSchedules })
			} else {
				this.prepareOptions(this.state.DepartSchedules)
				this.setState({ Schedules: this.state.DepartSchedules })
			}
		}
		if(Itinerary.DepartureDate != prevProps.Itinerary.DepartureDate || Itinerary.ReturnDate != prevProps.Itinerary.ReturnDate) {
			this.setChangeDateList()
			this.getData(true)
		}
	}

    componentDidMount() { 
		this.setChangeDateList()
		if(this.validatePassengers()) {
			setTimeout(() => {
				this.getData()
			}, 500);
		}
	}

	validatePassengers() {
		let { Adult, Kids } = this.props.Passengers
		let Infant = Kids.filter(e => e < 2).length
		let Child = Kids.filter(e => e >= 2).length
		this.setState({ Adult, Child, Infant })
		this.props.setPassenger({ Adult, Child, Infant })
		if(Infant > Adult || (Child+Adult) > MAX_PASSENGERS) {
			this.setState({ showErrorPassenger: true, isLoading: false })	
			return false
		} 
		else {
			this.setState({ showErrorPassenger: false, Adult, Child, Infant })
			if(Child > 0) { 
				this.setState({ showPassengerCategoryChange: true })
			}
			else {
				this.setState({ showPassengerCategoryChange: false })
			}
        }
		return true
	}

	getData(dateChanged=false) {
		this.props.setLoading(true, 1)
		let multiCarrierCheck = (Data) => {
			Data.forEach(e => {
				let listOfCarrier = groupBy(e.flights, (flightData) => flightData.carrier.code)
				if(Object.keys(listOfCarrier).length > 1) e.isMultiCarrier = true
				else e.isMultiCarrier = false
			})
			return Data
		}
		let { SortOptions, Adult, Child, Infant } = this.state
		let { Itinerary, ReturnTrip, step } = this.props
		let { Origin1, Destination1, DepartureDate, ReturnDate } = Itinerary
		let Jurusan = [{
			"OrgCode": Origin1.Code,
			"DesCode": Destination1.Code,
			"DepartDate": DepartureDate
		}]
		if(ReturnTrip) Jurusan.push({
			"OrgCode": Destination1.Code,
			"DesCode": Origin1.Code,
			"DepartDate": ReturnDate
		})
        let body = {
            "CustomerID": "",
            "ClientID": "TravelKlik",
            "TravelType": 'Pesawat',
            "TrxType": "GET SCHEDULE",
            "Detail": {
                Jurusan,
                "Cls": "ALL",
                "Pax": {
                    "Adt": Adult,
                    "Chd": Child,
                    "Inf": Infant
				},
				"Route": "ALL",
    			"PrefAirLine": [],
                "SearchParam": {
                    "maxPageSize": "",
                    "pageNumber": 0,
                    "_pageSize": 1000
                }
            }
        }
		this.setState({ isLoading: true })
		let url = `${TRAVEL_API_URL}/Transactions/post/`
        travelAPI(url, 'POST', body, (response) => {
            if (response.RespCode == '00') {
				let { TrxID, Detail } = response
                let { onwardJourneys, returnJourneys, isDomestic } = Detail
                if (onwardJourneys) {
                    let { DataResult } = onwardJourneys
					
                    step == 1 ? this.prepareOptions(DataResult) : null
					
					let sortedData = orderBy(DataResult, ['seatsLeft > 0', 'seatsLeft', (e) => { return e.fares.paxFares.adt.total.amount }, (e) => { return e.flights[0].depDetail.time }], ['desc', 'desc', 'asc', 'asc'])
					
					sortedData = multiCarrierCheck(sortedData)
					
					this.setState({ DepartSchedules: sortedData, Schedules: sortedData, SortOptions, isDomestic, TrxID })
				}
				if(returnJourneys && returnJourneys.DataResult.length > 0) {
					let { DataResult } = returnJourneys
					let sortedData = orderBy(DataResult, ['seatsLeft > 0', 'seatsLeft', (e) => { return e.fares.paxFares.adt.total.amount }, (e) => { return e.flights[0].depDetail.time }], ['desc', 'desc', 'asc', 'asc'])
					sortedData = multiCarrierCheck(sortedData)
					step == 2 ? this.prepareOptions(DataResult) : null
					if(dateChanged) this.setState({ Schedules: sortedData, ReturnSchedules: sortedData })
					this.setState({ ReturnSchedules: sortedData, isDomestic })
				}
			}
			else this.props.setLowestPrice(null, 1)
			this.setState({ isLoading: false })
			this.props.setLoading(false, 1)
		})
	}
	
	prepareOptions(DataResult) {
		let { SortOptions } = this.state
		//Get Lowest Price for Tab and Sort
		let LowestPrice = orderBy(DataResult, ['seatsLeft', (e) => { return e.fares.paxFares.adt.total.amount }, ], ['desc', 'asc'])
		SortOptions[0].content = LowestPrice[0].fares.paxFares.adt.total.amount
		this.setState({ lowestPrice: SortOptions[0].content })
		this.props.setLowestPrice(SortOptions[0].content, 1)
		
		//Get Fastest Departure Time Sort
		let FastestDeparture = orderBy(DataResult, ['seatsLeft', (e) => { return e.flights[0].depDetail.time}], ['desc', 'asc'])
		SortOptions[1].content = Waktu(FastestDeparture[0].flights[0].depDetail.time, null, ':')
		
		//Get Fastest Travel Time Sort
		let FastestTime = orderBy(DataResult, ['seatsLeft', (e) => { return e.journeyInfo[0].journeyTime}], ['desc', 'asc'])
		SortOptions[2].content = moment.utc().startOf('day').add({ minutes: FastestTime[0].journeyInfo[0].journeyTime }).format('HH[j] mm[m]')
		this.setState({ SortOptions })
	}
	
	selectTicket(Ticket) {
		let { isDomestic, TrxID } = this.state
		this.props.selectTicket(Ticket, { 
			isDomestic,
			TrxID
		})
		
	}

	renderSorting = () => {
		let { SortOptions, Schedules, FilteredSchedules } = this.state
		let selectSortCategory = (Option, i) => {
			let selectedIndex = SortOptions.findIndex(Option => Option.selected == true)
			SortOptions[selectedIndex].selected = false
			SortOptions[i].selected = true
			if (FilteredSchedules && FilteredSchedules.length > 0) {
				FilteredSchedules = orderBy(FilteredSchedules, ['seatsLeft', i == 0 ? (e) => { return parseInt(e.fares.paxFares.adt.total.amount) } : Option.sortBy], ['desc', 'asc'])
			} else {
				Schedules = orderBy(Schedules, ['seatsLeft', i == 0 ? (e) => { return parseInt(e.fares.paxFares.adt.total.amount) } : Option.sortBy], ['desc', 'asc'])
			}
			this.setState({ SortOptions, showSortModal: false, FilteredSchedules, Schedules })
		}
		return (
			<View>
				{SortOptions.map((Option, i) => {
					return (
						<TouchableOpacity key={i} onPress={() => selectSortCategory(Option, i)}>
							<SpaceBetween style={styles.detailItem}>
								<View style={{ flexDirection: 'row' }}>
									<Text style={{ color: 'black', fontSize: 13, fontWeight: Option.selected ? 'bold' : 'normal', marginRight: 15 }}>{Option.label}</Text>
									<Text style={{ color: 'grey', fontSize: 13, fontWeight: Option.selected ? 'bold' : 'normal' }}>{isNaN(Option.content) ? Option.content : Rupiah(Option.content)}</Text>
								</View>
								{Option.selected ?
									<AutoHeightImage
										width={18}
										source={require('../../assets/travel/Check-green.png')}/> : null
								}
							</SpaceBetween>
						</TouchableOpacity>
					)
				})}
			</View>
		)
	}

	setChangeDateList() {
		let getLowestPrice = (isReturn, date) => {
			let { Itinerary } = this.props
			let { Origin1, Destination1 } = Itinerary
			let body = {
				"ClientID": "TravelKlik",
				"TravelType": "Pesawat",
				"TrxType": "GET LOWEST PRICE",
				"Detail": {
					"Jurusan": [
						{
							"OrgCode": isReturn ? Destination1.Code : Origin1.Code,
							"DesCode": isReturn ? Origin1.Code : Destination1.Code,
							"DepartDate": date
						}
					],
					"Pax": {
						"Adt": 1,
						"Chd": 1,
						"Inf": 1
					},
					"Route": "ALL",
					"PrefAirLine": []
				}
			}
			let url = `${TRAVEL_API_URL}/Transactions/post/`
			return new Promise((resolve, reject) => {
				return travelAPI(url, 'POST', body, (response) => {
					if (response.RespCode == '00') {
						let { Detail } = response
						if(!isEmpty(Detail)) resolve(Detail.onwardJourneys[0].fares.paxFares.adt.total.amount)
						else resolve(0)
					}
					else resolve(0)
				})
			})
		}
		let { Itinerary, step } = this.props
		let { DepartureDate, ReturnDate } = Itinerary
		let changeDateIndex = 0
		let today = step == 1 ? DepartureDate : ReturnDate
		let dateList = []
		let maxDateInterval = ReturnDate ? moment(step == 1 ? ReturnDate : DepartureDate).diff(today, 'days') : 3
		let minDateInterval = moment(step == 1 ? DepartureDate : ReturnDate).diff(today, 'days')
		if (step == 1) {
			if (minDateInterval >= 3) {
				minDateInterval = 3
			}
			else {
				maxDateInterval += (3 - minDateInterval)
			}
		}
		else if (step == 2) {
			if (maxDateInterval >= 3) {
				maxDateInterval = 3
			}
			else {
				minDateInterval += (3 - maxDateInterval)
			}
		}

		for (let i = minDateInterval; i >= 1; i--) {
			dateList.push(moment(step == 1 ? DepartureDate : ReturnDate).subtract(i, "days").locale("id").format('MM/DD/YYYY'))
			++changeDateIndex
		}
		// dateList.push(moment(step == 1 ? DepartureDate : ReturnDate).format('MM/DD/YYYY'))
		for (let i = 1; i <= maxDateInterval; i++) {
			dateList.push(moment(step == 1 ? DepartureDate : ReturnDate).add(i, "days").format('MM/DD/YYYY'))
		}

		this.setState({ changeDateIndex }, () => {
			this.setState({ isLowestPriceLoading: true })
			let promises = []
			dateList.map(e => promises.push(getLowestPrice(step == 1 ? false : true, e)))
			Promise.all(promises).then((result) => {
				if(result) {
					dateList.forEach((e, i, o) => {
						o[i] = {
							date: o[i],
							price: result[i]
						}
					})
					this.setState({ dateList, isLowestPriceLoading: false })
				}
			})
		})
	}

	renderChangeDate = () => {
		let changeSearchDate = (date) => {
			this.setChangeDateList()
			this.setState({ showChangeDateModal:false }, () => {
				this.props.changeDate(date)
			})
		}
		let { changeDateIndex, lowestPrice, isLowestPriceLoading } = this.state
		let { step, Itinerary } = this.props
		let { DepartureDate, ReturnDate } = Itinerary
		DepartureDate = moment(DepartureDate).format('MM/DD/YYYY')	
		ReturnDate = moment(ReturnDate).format('MM/DD/YYYY')	
		return (
			<FlatList
				ref={(ref) => this.snapScroll = ref}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
				snapToInterval={interval}
				snapToAlignment={"center"}
				onLayout={()=> {
					setTimeout(() => {
						this.snapScroll.scrollToIndex({index: changeDateIndex-1 < 0 ? 0 : changeDateIndex-1})
					}, 500)
				}}
				getItemLayout={(data, index) => (
					{ length: SCREEN_WIDTH - (SCREEN_WIDTH/1.5)-10, offset: (SCREEN_WIDTH - (SCREEN_WIDTH/1.5) -10) * index, index }
				)}
				contentInset={{
					top: 0,
					left: (SCREEN_WIDTH/2) - (SCREEN_WIDTH - (SCREEN_WIDTH/1.5))/2,
					bottom: 0,
					right: (SCREEN_WIDTH/2) - (SCREEN_WIDTH - (SCREEN_WIDTH/1.5))/2 - 10,
				}}
				data={this.state.dateList}
				extraData={this.state.dateList}
				keyExtractor={(item, index) => index.toString()}
				renderItem={({item, index}) => {
					let price = 0
					let priceDigits = [], firstDigits = 0
					if(item.date == DepartureDate && step == 1) item.price = lowestPrice
					item.price = Number(item.price)
					if(item.price > 0) {
						price = Rupiah(item.price)
						price = price.split('Rp ')[1]
						priceDigits = price.split('.')
						firstDigits = priceDigits[0]
						priceDigits.splice(0,1)
						priceDigits = priceDigits.join('.')
					}
					let activeColor = (step == 1 && item.date == DepartureDate) || (step == 2 && item.date == ReturnDate) ? blue : 'black'
					return (
						<TouchableOpacity style={[styles.changeDateBox, { borderColor: activeColor }]} key={index} onPress={() => changeSearchDate(item.date)}>
							<Text style={[styles.changeDateText, { color: activeColor, marginBottom: 5, fontWeight: activeColor == 'black' ? 'normal' : 'bold' }]}>{moment(item.date).format("ddd, DD MMM")}</Text>
							{
								isLowestPriceLoading ? (
									<TravelLoading page='single'/>
								) : (
									price > 0 ? (
										<Text style={[styles.changeDateText, { fontSize: 12, fontWeight: activeColor == 'black' ? 'normal' : 'bold', color: activeColor }]}>Rp <Text style={{ fontSize: 16 }}>{firstDigits}.</Text><Text>{priceDigits}</Text></Text>
									) : (
										<Text style={[styles.changeDateText, { fontSize: 12, fontWeight: activeColor == 'black' ? 'normal' : 'bold', color: activeColor }]}>Lihat Detail</Text>
									)
								)
							}
						</TouchableOpacity>
					)
				}}/>
		)
	}

	filterSearch = () => {
		let { Schedules, FilterOptions } = this.state
		let { Itinerary } = this.props
		let { Origin1, Destination1 } = Itinerary
		let Origin = Origin1
		let Destination = Destination1

		pushScreen(
			this.props.componentId,
			'TravelFlightFilter',
			{
				Schedules,
				Origin,
				Destination,
				FilterOptions,
				onSave: (obj) => {
					this.setState(obj)
					if(obj.FilteredSchedules && obj.FilteredSchedules.length) this.prepareOptions(obj.FilteredSchedules)
					else this.prepareOptions(this.state.Schedules)
				}
			}
		)
	}

    renderTicket = (data, index) => {
		let onDetail = (Ticket) => {
            pushScreen(this.props.componentId, 'TravelFlightDetail', {
				index,
				...data,
				selectTicket: () => {
					this.selectTicket(Ticket)
				}
            })
        }
		let { seatsLeft, flights, fares, key, journeyInfo, isMultiCarrier } = data 
		let flightNo = []
		let carriers = []
		flights.forEach(e => flightNo.push(e.flightNo))
		flights.forEach(e => carriers.push(e.carrier))
		let { depDetail } = flights[0]
		let { arrDetail } = flights[flights.length - 1]
		const isAvailable = data.seatsLeft > 0
		const DynamicTag = index == 'selected' || !isAvailable ? View : TouchableOpacity
		return (
			<DynamicTag key={key} style={[layoutStyles.card, (index == 'selected' ? styles.cardSelected : null), { backgroundColor: !isAvailable ? softgrey : 'white' }]} onPress={() => isAvailable ? this.selectTicket(data) : null}>
				<SpaceBetween>
					<View style={[layoutStyles.rowCenterVertical, { flex: 5.8 }]}>
						<AutoHeightImage
							width={SCREEN_WIDTH/10}
							source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : {uri: carriers[0].iconUrl}} 
							style={{ marginRight: 10, opacity: isAvailable ? 1 : 0.6 }}/>
						<View style={{ flexShrink: 1 }}>
							<Text style={[isAvailable ? textStyles.black : textStyles.grey, textStyles.bold, { marginBottom: 2, fontSize: 13, flexWrap: 'wrap' }]}>{isMultiCarrier ? 'Multi-Maskapai' : carriers[0].name}</Text>
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
					<View style={{ flex: .2 }}></View>
					<View style={{ flex: 4, alignSelf: 'flex-start' }}>
						{
							index == 'selected' ?
								<Image
									style={{ marginBottom: 5, alignSelf: 'flex-end' }}
									source={require('../../assets/travel/Check-green2.png')} /> 
								: null
						}
						<Text style={[textStyles.bold, textStyles.alignRight, textStyles.medium, { color: isAvailable ? orange : 'grey' }]}>{Rupiah(fares.paxFares.adt.total.amount)}<Text style={[textStyles.xSmall, textStyles.grey, textStyles.bold]}>/org</Text></Text>
						{
							index == 'selected' ? null :
								(!isAvailable ?
									<Text style={[textStyles.red, textStyles.small, textStyles.alignRight]}>Kursi Penuh</Text> :
									<Text style={[textStyles.red, textStyles.small, textStyles.alignRight]}>{`${seatsLeft} kursi tersisa`}</Text>)
						}
					</View>
				</SpaceBetween>

				<SpaceBetween style={{ marginTop: 5, marginLeft: 5 }}>
					<View style={layoutStyles.rowCenterVertical}>
						<View style={{ alignItems: 'center' }}>
							<Text style={[textStyles.xSmall, textStyles.grey, { marginBottom: 3 }]}>{depDetail.code}</Text>
							<Text style={[textStyles.xxSmall]}>{moment(depDetail.time).locale('id').format('HH:mm')}</Text>
						</View>
						<View style={{ alignItems: 'center', marginHorizontal: 10 }}>
							<View style={[layoutStyles.rowCenterVertical, { marginBottom: 5 }]}>
								<Text style={[textStyles.xSmall, textStyles.grey]}>{moment.utc().startOf('day').add({ minutes: journeyInfo[0].journeyTime }).format('HH[j] mm[m]')}</Text>
								{
									flights.length > 1 ? (
										<View style={layoutStyles.rowCenterVertical}>
											<Image source={require('../../assets/travel/flight/plane-horizontal.png')} style={marginStyles.itemHorizontal}/>
											<Text style={[textStyles.xSmall, textStyles.grey]}>{`${flights.length-1} transit`}</Text>
										</View>
									) : null
								}
							</View>
							<View style={{ borderBottomWidth: 1, borderBottomColor: 'grey', height: 1, width: 100 }} />
						</View>
						<View style={{ alignItems: 'center' }}>
							<Text style={[textStyles.xSmall, textStyles.grey, { marginBottom: 3 }]}>{arrDetail.code}</Text>
							<Text style={[textStyles.xSmall]}>{moment(arrDetail.time).locale('id').format('HH:mm')}</Text>
						</View>
					</View>

					{
						index == 'selected' ? (
							<TouchableOpacity onPress={() => onDetail(data)} style={[layoutStyles.rowCenterVertical, {alignSelf: 'flex-end'}]}>
								<Text style={{ color: blue }}>Lihat Detail</Text>
								<Image
									style={{ marginLeft: 5 }}
									source={require('../../assets/travel/Arrow1-down-blue.png')} />
							</TouchableOpacity>
						) : (
							<TouchableOpacity onPress={() => onDetail(data)} style={[layoutStyles.rowCenterVertical, {alignSelf: 'flex-end'}]}>
								<Text style={{ color: blue }}>Lihat Detail</Text>
								<Image
									style={{ marginLeft: 5 }}
									source={require('../../assets/travel/Arrow1-down-blue.png')} />
							</TouchableOpacity>
						)
					}
				</SpaceBetween>
			</DynamicTag>
		)
	}

	emptySchedules = () => {
		return (
			<View style={[layoutStyles.safearea, layoutStyles.center]}>
				<Image style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 4 }} source={require('../../assets/travel/Ilustrasi/NoFlightsR1.png')} />
				<Text style={{ fontWeight: 'bold', fontSize: 18, color: black, margin: 8 }}>Rute pesawat tidak tersedia</Text>
				<Text style={{ color: 'grey', textAlign: 'center', paddingHorizontal: 20, margin: 8 }}>Rute pesawat tidak tersedia, silahkan ganti rute atau tanggal Anda.</Text>
				<Button
					style={{ backgroundColor: blue, width: SCREEN_WIDTH / 1.5, alignSelf: 'center' }}
					text="Ganti Pencarian"
					bold
					onPress={() => this.props.research()}>
				</Button>
			</View>
		)
	}

    render() {
		let { step, DepartureTicket, ReturnTicket, ReturnTrip } = this.props
		let { isLoading, Schedules, Adult, Child, Infant, showErrorPassenger, showPassengerCategoryChange } = this.state
        return (
            <View style={layoutStyles.safearea}>
				<ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
					<View style={searchResultStyles.selectedTicketBlock}>
						{DepartureTicket && ReturnTrip ?
							<View>
								<Text style={searchResultStyles.selectedTicketLabel}>Pergi</Text>
								{this.renderTicket(DepartureTicket, "selected")}
							</View> : null
						}
						{ReturnTicket && ReturnTrip ?
							<View>
								<Text style={searchResultStyles.selectedTicketLabel}>Pulang</Text>
								{this.renderTicket(ReturnTicket, "selected")}
							</View> : null
						}
					</View>
					{
						!showErrorPassenger ? (
							<SpaceBetween style={[marginStyles.itemHorizontalxxLarge, marginStyles.itemLarge]}>
								<Text style={[textStyles.bold, textStyles.grey, textStyles.xLarge]}>{`Pesawat ${step == 2 ? 'Pulang' : 'Pergi'}`}</Text>
								<View style={layoutStyles.rowCenterVertical}>
									<Image source={require('../../assets/travel/User.png')} style={{ tintColor: 'black', width: 15, height: 15, resizeMode: 'contain' }}/>
									<Text style={{ marginLeft: 10 }}>{Adult} Dewasa{Child ? `, ${Child} Anak` : ''}{ Infant ? `, ${Infant} Bayi` : ''}</Text>
								</View>
							</SpaceBetween>
						) : null
					}
					{
						showPassengerCategoryChange ? (
							<View style={styles.box}>
								<View style={layoutStyles.rowCenterVertical}>
									<Image source={require('../../assets/travel/Info-blue.png')} style={{ tintColor: TRAVEL_ORANGE, marginRight: 10 }}/>
									<Text style={[textStyles.small, textStyles.orange, { marginLeft: 10, flex: 1, marginRight: 10 }]}>Sesuai dengan ketentuan maskapai, penumpang berumur 2-11 tahun adalah kategori Anak</Text>
									<TouchableWithoutFeedback onPress={() => this.setState({ showPassengerCategoryChange: false })}>
										<View>
											<Image source={require('../../assets/travel/Close.png')} style={{ tintColor: TRAVEL_ORANGE }}/>
										</View>
									</TouchableWithoutFeedback>
								</View>
							</View>
						) : null
					}
					{
						isLoading ? (
							<View style={{ flex: 1, marginHorizontal: 20 }}>
								{[0, 1, 2, 3].map((i) => {
									return (
										<TravelLoading key={i} page={'searchresult'} />
									)
								})}
							</View>) : (
								<View style={layoutStyles.safearea}>
									{
										showErrorPassenger ? (
											<View style={[layoutStyles.safearea, layoutStyles.container, layoutStyles.center]}>
												<Image style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 4 }} source={require('../../assets/travel/Ilustrasi/NoFlightsR1.png')} />
												<Text style={{ fontWeight: 'bold', fontSize: 18, color: black, margin: 8, textAlign: 'center' }}>Jumlah atau kategori penumpang tidak sesuai ketentuan</Text>
												<Text style={{ color: 'grey', textAlign: 'center', paddingHorizontal: 20, margin: 8 }}>Silahkan ubah jumlah atau kategori penumpang agar dapat melakukan pencarian Kereta.</Text>
												<Button
													style={{ backgroundColor: 'white', width: SCREEN_WIDTH / 1.5, alignSelf: 'center', borderColor: TRAVEL_BLUE, borderWidth: 1 }}
													text="Ubah Pencarian"
													textColor={TRAVEL_BLUE}
													bold
													onPress={() => this.props.research()}>
												</Button>
											</View>
										) : (
											<View style={layoutStyles.safearea}>
												<FlatList
													data={this.state.FilteredSchedules ? this.state.FilteredSchedules : this.state.Schedules}
													extraData={this.state.FilteredSchedules ? this.state.FilteredSchedules : this.state.Schedules}
													keyExtractor={(item, index) => index.toString()}
													renderItem={({item, index}) => this.renderTicket(item, index)}
													ListEmptyComponent={this.emptySchedules}
													scrollEnabled={this.state.Schedules.length ? true : false}
													contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
													style={{ flex: 1 }}/>
											</View>
										)
									}
								</View>
							)
					}
				</ScrollView>
				<View style={searchResultStyles.bottomActionBar}>
					<TouchableOpacity onPress={() => this.filterSearch()} style={{ flex: 4, flexDirection: 'row', justifyContent: 'center' }}>
						<Image
							source={require('../../assets/travel/Filter-grey.png')} />
						<Text style={{ fontWeight: '700', marginLeft: 10 }}>Filter</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => this.setState({ showChangeDateModal: true })} style={{ flex: 2, height: 50, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderLeftColor: 'lightgrey', borderRightColor: 'lightgrey' }}>
						<Image
							source={require('../../assets/travel/Date-grey.png')} />
					</TouchableOpacity>

					<TouchableOpacity onPress={() => this.setState({ showSortModal: true })} style={{ flex: 4, flexDirection: 'row', justifyContent: 'center' }}>
						<Image
							source={require('../../assets/travel/Sort-grey.png')} />
						<Text style={{ fontWeight: '700', marginLeft: 10 }}>Urutkan</Text>
					</TouchableOpacity>
				</View>
				<Modal
					isVisible={this.state.showSortModal && Schedules.length > 0}
					onBackButtonPress={() => this.setState({ showSortModal: false })}
					onBackdropPress={() => this.setState({ showSortModal: false })}
					style={modalStyles.popUp}>
					<View style={modalStyles.popUpDetail}>
						<View style={modalStyles.popUpHeader}>
							<TouchableOpacity onPress={() => this.setState({ showSortModal: false })}>
								<Image style={{ width: 15, height: 15, tintColor: 'black' }} source={require('../../assets/travel/Close.png')} />
							</TouchableOpacity>
							<View>
								<Text style={{ color: 'black', fontSize: 20, fontWeight: '700', marginLeft: 20 }}>Urutkan</Text>
							</View>
						</View>
						{this.renderSorting()}
					</View>
				</Modal>

				<Modal
					isVisible={this.state.showChangeDateModal}
					onBackButtonPress={() => this.setState({ showChangeDateModal: false })}
					onBackdropPress={() => this.setState({ showChangeDateModal: false })}
					style={modalStyles.popUp}
					propagateSwipe={true}
					scrollHorizontal={true}>
					<View style={modalStyles.popUpDetail}>
						<View style={modalStyles.popUpHeader}>
							<TouchableOpacity onPress={() => this.setState({ showChangeDateModal: false })}>
								<Image style={{ width: 15, height: 15, tintColor: 'black' }} source={require('../../assets/travel/Close.png')} />
							</TouchableOpacity>
							<View>
								<Text style={{ color: 'black', fontSize: 20, fontWeight: '700', marginLeft: 20 }}>Ganti Tanggal</Text>
							</View>
						</View>
						{this.renderChangeDate()}
					</View>
				</Modal>
            </View>
        )
    }
}

const styles = StyleSheet.create({
	cardSelected: {
		shadowColor: null,
		shadowOffset: null,
		shadowOpacity: null,
		shadowRadius: null,
		elevation: 0,
		marginBottom: 10,
		padding: 15,
		marginHorizontal: 18,
		backgroundColor: 'white',
		minHeight: SCREEN_HEIGHT / 12,
		borderRadius: 5
	},
	box: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: TRAVEL_ORANGE,
        backgroundColor: TRAVEL_LIGHT_ORANGE,
		...marginStyles.paddingSmall,
		...marginStyles.itemHorizontalLarge,
		...marginStyles.itemLarge
	},
	detailItem: {
		padding: 15,
		paddingHorizontal: 30
	},
	changeDateBox: {
		justifyContent: 'center',
		alignItems: 'center',
		width: SCREEN_WIDTH - (SCREEN_WIDTH/1.5),
		height: SCREEN_HEIGHT / 10,
		padding: 10,
		borderWidth: 1,
		borderRadius: 5,
		marginHorizontal: 5
	},
	changeDateText: {
		flex: 1,
		flexWrap: 'wrap',
		textAlign: 'center',
		alignSelf: 'center',
		justifyContent: 'center'
	},
})