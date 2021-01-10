import { orderBy, startCase, toLower, isEmpty } from 'lodash';
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
import { isIphoneXorAbove, pushScreen } from '../../libs/navigation';
import deeplink from '../../libs/deeplink';

const interval = (SCREEN_WIDTH - Math.ceil(SCREEN_WIDTH/1.5) + 10)

export default class extends Component {
	constructor(props) {
		super(props);
		this.state = {
			Adult: props.Passengers.Adult,
			Child: 0,
			Infant: 0,
			dateList: [],
			Schedules: [],
			SelectedTicket: null,

			isLoading: true,
			showErrorPassenger: false,
			showPassengerCategoryChange: false,
			showDetailModal: false,
			showSortModal: false,
			showChangeDateModal: false,

			changeDateIndex: 0,
			lowestPrice: 0,
			SortOptions: [
				{
					selected: true,
					label: 'Harga termurah',
					content: 0,
					sortBy: 'fares[0].amount'
				},
				{
					selected: false,
					label: 'Keberangkatan paling awal',
					content: '05:45',
					sortBy: 'departdatetime'
				},
				{
					selected: false,
					label: 'Durasi tercepat',
					content: '5j 45m',
					sortBy: 'durationtime'
				}
			]
		}
		this.scrollView = undefined
	}

	// static getDerivedStateFromProps(nextProps, prevState){
    //     if(nextProps.step == 2 && nextProps.ReturnTicket){
    //         pushScreen(this.props.componentId, 'TravelTrainPassengerForm', {
	// 			DepartureTicket: nextProps.DepartureTicket,
	// 			ReturnTicket: nextProps.ReturnTicket,
	// 			ReturnTrip: nextProps.ReturnTrip,
	// 			Adult: nextProps.Passengers.Adult,
	// 			Child: nextProps.Passengers.Child,
	// 			Infant: nextProps.Passengers.Infant
	// 		})
    //     }
    //     return null
    // }

    componentDidMount() { 
		this.setChangeDateList()
		if(this.validatePassengers()) {
			setTimeout(() => {
				this.getData()
			}, 500);
		}
	}

	componentDidUpdate(prevProps){
		let { Itinerary } = this.props	
		if((this.props.step != prevProps.step) && (this.props.ReturnTrip)) {
			this.getData()
		}
		else if(Itinerary.DepartureDate != prevProps.Itinerary.DepartureDate || Itinerary.ReturnDate != prevProps.Itinerary.ReturnDate) {
			this.getData()
		}
	}

	validatePassengers() {
		let { Adult, Kids } = this.props.Passengers
		let Infant = Kids.filter(e => e < 3).length
		let Child = Kids.filter(e => e >= 3).length
		Adult += Child
		this.setState({ Adult, Child, Infant })
		this.props.setPassenger({ Adult, Child, Infant })
		if(Adult > 4 || Infant > Adult) {
			this.setState({ showErrorPassenger: true, isLoading: false })	
			return false
		} 
		else {
			this.setState({ showErrorPassenger: false })
			if(Child > 0) { 
				this.setState({ showPassengerCategoryChange: true })
			}
			else {
				this.setState({ showPassengerCategoryChange: false })
			}
		}
		return true
	}

	getData() {
		this.props.setLoading(true, 0)
		let { SortOptions, Adult, Child, Infant } = this.state
		let { Itinerary, step } = this.props
		let { Origin1, Destination1, DepartureDate, ReturnDate } = Itinerary
		let isReturn = step == 2 ? true : false
        let body = {
            "CustomerID": "",
            "ClientID": "TravelKlik",
            "TravelType": 'Kereta',
            "TrxType": "GET SCHEDULE",
            "Detail": {
                "Jurusan": [
                    {
                        "OrgCode": isReturn ? Destination1.Code : Origin1.Code,
                        "DesCode": isReturn ? Origin1.Code : Destination1.Code,
                        "DepartDate": isReturn ? ReturnDate : DepartureDate
                    }
                ],
                "Cls": "ALL",
                "Pax": {
                    "Adt": Adult,
                    "Chd": Child,
                    "Inf": Infant
				},
                "SearchParam": {
                    "maxPageSize": "",
                    "pageNumber": 0,
                    "_pageSize": 10000
                }
            }
        }
		this.setState({ isLoading: true })
		let url = `${TRAVEL_API_URL}/Transactions/post/`
        travelAPI(url, 'POST', body, (response) => {
            if (response.RespCode == '00') {
				let data = []
                if (response.Detail.DataResult && response.Detail.DataResult.length > 0) {
                    response.Detail.DataResult.forEach((item, i) => {
                        let first = Object.assign({}, item)
                        first.trainname = startCase(toLower(first.trainname))
                        data.push(first)
                        // item.fares.forEach((a) => data.push(Object.assign({}, first, a)))
                    })
    
                    let sortedData = orderBy(data, ['availability > 0', 'isScheduleDisabled', (e) => { return parseInt(e.fares[0].amount) }, 'departdatetime', ], ['desc', 'asc', 'asc', 'asc'])
    
                    //Get Lowest Price for Tab and Sort
                    let LowestPrice = orderBy(data, ['availability > 0', function(e) { return parseInt(e.fares[0].amount) }], ['desc', 'asc'])
					SortOptions[0].content = LowestPrice[0].fares[0].amount
					this.setState({ lowestPrice: SortOptions[0].content })
					this.props.setLowestPrice(SortOptions[0].content, 0)
    
                    //Get Fastest Departure Time Sort
                    let FastestDeparture = orderBy(data, ['availability > 0', 'departdatetime'], ['desc', 'asc'])
                    SortOptions[1].content = Waktu(FastestDeparture[0].departdatetime, null, ':')
    
                    //Get Fastest Travel Time Sort
                    let FastestTime = orderBy(data, ['availability > 0', 'durationtime'], ['desc', 'asc'])
                    SortOptions[2].content = moment(FastestTime[0].durationtime, "HH:mm:ss").format("HH[j] mm[m]")
    
					this.setState({ Schedules: sortedData, SortOptions })
				}
				else {
					this.props.setLowestPrice(null, 0)
					this.setState({ Schedules: [] })
				}
			}
			else this.props.setLowestPrice(null, 0)
			this.setState({ isLoading: false })
			this.props.setLoading(false, 0)
        })
	}
	
	setChangeDateList = () => {
		let getLowestPrice = (isReturn, date) => {
			let { Itinerary } = this.props
			let { Origin1, Destination1 } = Itinerary
			let body = {
				"ClientID": "TravelKlik",
				"TravelType": "Kereta",
				"TrxType": "GET LOWEST PRICE",
				"Detail": {
					"Jurusan": [
						{
							"OrgCode": isReturn ? Destination1.Code : Origin1.Code,
							"DesCode": isReturn ? Origin1.Code : Destination1.Code,
							"DepartDate": date
						}
					],
					"Cls": "ALL",
					"Pax": {
						"Adt": 1,
						"Inf": 1
					}
				}
			}
			let url = `${TRAVEL_API_URL}/Transactions/post/`
			return new Promise((resolve, reject) => {
				return travelAPI(TRAVEL_API_URL, 'POST', body, (response) => {
					if (response.RespCode == '00') {
						let { Detail } = response
						if(!isEmpty(Detail)) resolve(Detail.fares[0].amount)
						else resolve(0)
					}
					else resolve(0)
				})
			})
		}
		let { Itinerary, step } = this.props
		let { DepartureDate, ReturnDate } = Itinerary
		let changeDateIndex = 0
		let today = DepartureDate
		let beforetoday = moment(today, "MM/DD/YYYY").subtract(3, 'days');
		let dateList = []
		// let maxDateInterval = ReturnDate ? moment(step == 1 ? moment(ReturnDate, "MM/DD/YYYY").subtract(1, 'days') : DepartureDate).diff(today, 'days') : 3
		let maxDateInterval = 3
		if(step == 1 && ReturnDate) maxDateInterval = moment(step == 1 ? moment(ReturnDate, "MM/DD/YYYY").subtract(1, 'days') : DepartureDate).diff(today, 'days')
		let minDateInterval = moment(step == 1 ? DepartureDate : ReturnDate).diff(beforetoday, 'days')

		if (step == 1) {
			if (minDateInterval >= 3) {
				minDateInterval = 3
			}
			else if(maxDateInterval > 3) maxDateInterval = 3
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
	
	selectTicket(Ticket) {
		this.props.selectTicket(Ticket)
		this.setState({ showDetailModal:false })
	}

	renderSorting = () => {
		let { SortOptions, Schedules, FilteredSchedules } = this.state
		let selectSortCategory = (Option, i) => {
			let selectedIndex = SortOptions.findIndex(Option => Option.selected == true)
			SortOptions[selectedIndex].selected = false
			SortOptions[i].selected = true
			if (FilteredSchedules && FilteredSchedules.length > 0) {
				FilteredSchedules = orderBy(FilteredSchedules, ['availability > 0', i == 0 ? (e) => { return parseInt(e.fares[0].amount) } : Option.sortBy], ['desc', 'asc'])
			} else {
				Schedules = orderBy(Schedules, ['availability > 0', i == 0 ? (e) => { return parseInt(e.fares[0].amount) } : Option.sortBy], ['desc', 'asc'])
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

	renderChangeDate = () => {
		let changeSearchDate = (date) => {
			this.setChangeDateList()
			this.setState({ showChangeDateModal:false }, () => {
				this.props.changeDate(date)
			})
		}
		let { changeDateIndex, lowestPrice, isLowestPriceLoading } = this.state
		let { step, Itinerary } = this.props
		let { DepartureDate } = Itinerary
		DepartureDate = moment(DepartureDate).format('MM/DD/YYYY')	
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
					return (
						<TouchableOpacity style={[styles.changeDateBox, { borderColor: item.date == DepartureDate ? blue : 'black' }]} key={index} onPress={() => changeSearchDate(item.date)}>
							<Text style={[styles.changeDateText, { color: item.date == (DepartureDate) ? blue : 'black', marginBottom: 5, fontWeight: item.date == DepartureDate ? 'bold' : 'normal' }]}>{moment(item.date).format("ddd, DD MMM")}</Text>
							{
								isLowestPriceLoading ? (
									<TravelLoading page='single'/>
								) : (
									price > 0 ? (
										<Text style={[styles.changeDateText, { fontSize: 12, fontWeight: item.date == DepartureDate ? 'bold' : 'normal', color: item.date == (DepartureDate) ? blue : 'black' }]}>Rp <Text style={{ fontSize: 16 }}>{firstDigits}.</Text><Text>{priceDigits}</Text></Text>
									) : (
										<Text style={[styles.changeDateText, { fontSize: 12, fontWeight: item.date == DepartureDate ? 'bold' : 'normal', color: item.date == (DepartureDate) ? blue : 'black' }]}>Lihat Detail</Text>
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
		let { step, Itinerary, ReturnTrip } = this.props
		let { Origin1, Destination1 } = Itinerary
		let Origin = Origin1
		let Destination = Destination1
		if (step == 2) {
			if (ReturnTrip) {
				Origin = Destination1
				Destination = Origin1
			}
			else if (MultiCity) {
				Origin = Origin2
				Destination = Destination2
			}
		}

		pushScreen(
			this.props.componentId,
			'TravelTrainFilter',
			{
				Schedules,
				Origin,
				Destination,
				FilterOptions,
				onSave: (obj) => {
					this.setState(obj)
				}
			}
		)
	}

    renderDetail = () => {
		let { SelectedTicket } = this.state
		if (SelectedTicket) {
			return (
				<View>
					<SpaceBetween style={{ padding: 30, paddingTop: 0 }}>
						<View style={[layoutStyles.rowCenterVertical]}>
							<AutoHeightImage
								width={50}
								source={require('../../assets/travel/Logo/KAI.png')} 
								style={{ marginRight: 10 }}/>
							<View style={{ flexShrink: 1 }}>
								<Text style={[textStyles.black, textStyles.bold, { marginBottom: 2, fontSize: 13, flexWrap: 'wrap' }]}>{SelectedTicket.trainname}</Text>
								<Text style={[textStyles.small, textStyles.grey]}>{`${SelectedTicket.wagonclasscodefull} (${SelectedTicket.subclass})`}</Text>
							</View>
						</View>
						<AutoHeightImage
							width={20}
							style={{ tintColor: 'grey' }}
							source={require('../../assets/travel/Train-blue.png')} />
					</SpaceBetween>

					<SpaceBetween>
						<View style={[layoutStyles.rowCenterVertical, { flex: 6.5 }]}>
							<View style={{ flex: 4.5, marginRight: 10 }}>
								<View>
									<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.black]}>{`${SelectedTicket.departdatetime.split('T')[1].substring(0, 5)}`}</Text>
									<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{`${moment(SelectedTicket.departdatetime.split('T')[0]).locale('id').format('DD MMM YYYY')}`}</Text>
								</View>

								<View style={{ marginTop: 30 }}>
									<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{moment(SelectedTicket.durationtime, "HH:mm:ss").format("HH[j] mm[m]")}</Text>
								</View>

								<View style={{ marginTop: 27 }}>
									<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.black]}>{`${SelectedTicket.arrivaldatetime.split('T')[1].substring(0, 5)}`}</Text>
									<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{`${moment(SelectedTicket.arrivaldatetime.split('T')[0]).locale('id').format('DD MMM YYYY')}`}</Text>
								</View>
							</View>

							<View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
								<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: 'grey', backgroundColor: 'white', zIndex: 1 }} />
								<View style={{ borderLeftWidth: 1, borderLeftColor: 'grey', height: 100}} />
								<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: blue, backgroundColor: blue, zIndex: 1 }} />
							</View>

							<View style={{ flex: 4.5, justifyContent: 'flex-start', marginLeft: 10 }}>
								<View>
									<Text style={[textStyles.xSmall, textStyles.black]}>{`${SelectedTicket.stasiunorgcity} (${SelectedTicket.stasiunorgcode})`}</Text>
									<Text style={[textStyles.xSmall, textStyles.grey]}>{SelectedTicket.stasiunorgname}</Text>
								</View>

								<View style={{ marginTop: 70 }}>
									<Text style={[textStyles.xSmall, textStyles.black]}>{`${SelectedTicket.stasiundestcity} (${SelectedTicket.stasiundestcode})`}</Text>
									<Text style={[textStyles.xSmall, textStyles.grey]}>{SelectedTicket.stasiundestname}</Text>
								</View>
							</View>
						</View>
						<View style={{ flex: 3.5 }}></View>
					</SpaceBetween>
					<View style={[layoutStyles.rowCenterVertical, { alignSelf: 'flex-end', paddingRight: 30, marginVertical: 5 }]}>
						<View></View>
						<View style={layoutStyles.rowCenterVertical}>
							<Text style={[textStyles.bold, { color: orange, fontSize: 16, alignItems: 'center', textAlignVertical: 'bottom' }]}>{Rupiah(SelectedTicket.fares[0].amount)}</Text>
							<Text style={[textStyles.xSmall, textStyles.grey, { alignSelf: 'flex-end' }]}>/org</Text>
						</View>
					</View>

					{SelectedTicket.availability > 0 ?
						<Button onPress={() => this.selectTicket(SelectedTicket)}
							text="Pesan"
							style={{ width: SCREEN_WIDTH, backgroundColor: TRAVEL_BLUE, textAlign: 'center', paddingBottom: isIphoneXorAbove() ? 30 : null, borderRadius: 0, marginTop: 20 }}
							styleText={{ color: 'white' }}></Button>
						: <Button style={{ marginTop: 20, marginHorizontal: -20, paddingBottom: isIphoneXorAbove() ? 30 : null, borderRadius: 0 }} backgroundColor={'#c5c5c5'} text='Kursi Penuh' />
					}
				</View>
			)
		}
		null
	}

    renderTicket = (data, index) => {
		let onDetail = (Ticket) => {
            this.setState({ showDetailModal: true, SelectedTicket: Ticket })
		}
		const isAvailable = data.availability > 0 || !data.isScheduleDisabled
		const showAvailability = data.showAvailability
		const DynamicTag = index == 'selected' || !isAvailable ? View : TouchableOpacity
		return (
			<DynamicTag key={index} style={[layoutStyles.card, (index == 'selected' ? styles.cardSelected : null), { backgroundColor: !isAvailable ? softgrey : 'white' }]} onPress={() => isAvailable ? this.selectTicket(data) : null}>
				<SpaceBetween>
					<View style={[layoutStyles.rowCenterVertical, { flex: 5.8 }]}>
						<AutoHeightImage
							width={SCREEN_WIDTH/10}
							source={require('../../assets/travel/Logo/KAI.png')} 
							style={{ marginRight: 10, opacity: isAvailable ? 1 : 0.6 }}/>
						<View style={{ flexShrink: 1 }}>
							<Text style={[isAvailable ? textStyles.black : textStyles.grey, textStyles.bold, { marginBottom: 2, fontSize: 13, flexWrap: 'wrap' }]}>{data.trainname}</Text>
							<Text style={[textStyles.xSmall, textStyles.grey]}>{`${data.wagonclasscodefull} (${data.subclass})`}</Text>
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
						<Text style={[textStyles.bold, textStyles.alignRight, textStyles.medium, { color: isAvailable ? orange : 'grey' }]}>{Rupiah(data.fares[0].amount)}<Text style={[textStyles.xSmall, textStyles.grey, textStyles.bold]}>/org</Text></Text>
						{
							index == 'selected' ? null :
								(!isAvailable ?
									<Text style={[textStyles.red, textStyles.small, textStyles.alignRight]}>Kursi Penuh</Text>
									:
									(showAvailability ? 
										<Text style={[textStyles.red, textStyles.small, textStyles.alignRight]}>{`${data.availability} kursi tersisa`}</Text>
										:
										null
									)
								)
						}
					</View>
				</SpaceBetween>

				<SpaceBetween style={{ marginTop: 5, marginLeft: 5 }}>
					<View style={layoutStyles.rowCenterVertical}>
						<View style={{ alignItems: 'center' }}>
							<Text style={[textStyles.xSmall, textStyles.grey]}>{data.stasiunorgcode}</Text>
							<Text style={[textStyles.xxSmall]}>{moment(data.departdatetime).locale('id').format('HH:mm')}</Text>
						</View>
						<View style={{ alignItems: 'center', marginHorizontal: 10 }}>
							<Text style={[textStyles.xSmall, textStyles.grey ,{ marginBottom: 5 }]}>{moment(data.durationtime, "HH:mm:ss").format("HH[j] mm[m]")}</Text>
							<View style={{ borderBottomWidth: 1, borderBottomColor: 'grey', height: 1, width: 100 }} />
						</View>
						<View style={{ alignItems: 'center' }}>
							<Text style={[textStyles.xSmall, textStyles.grey]}>{data.stasiundestcode}</Text>
							<Text style={[textStyles.xSmall]}>{moment(data.arrivaldatetime).locale('id').format('HH:mm')}</Text>
						</View>
					</View>

					<TouchableOpacity onPress={() => onDetail(data)} style={[layoutStyles.rowCenterVertical, {alignSelf: 'flex-end'}]}>
						<Text style={{ color: blue }}>Lihat Detail</Text>
						<Image
							style={{ marginLeft: 5 }}
							source={require('../../assets/travel/Arrow1-down-blue.png')} />
					</TouchableOpacity>
				</SpaceBetween>
			</DynamicTag>
		)
	}

	emptySchedules = () => {
		return (
			<View style={[layoutStyles.safearea, layoutStyles.center]}>
				<Image style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 4 }} source={require('../../assets/travel/Ilustrasi/NoTrainsR1.png')} />
				<Text style={{ fontWeight: 'bold', fontSize: 18, color: black, margin: 8 }}>Rute kereta tidak tersedia</Text>
				<Text style={{ color: 'grey', textAlign: 'center', paddingHorizontal: 20, margin: 8 }}>Rute kereta tidak tersedia, silahkan ganti rute atau tanggal Anda.</Text>
				<Button
					style={{ backgroundColor: blue, width: SCREEN_WIDTH / 1.5, alignSelf: 'center' }}
					text="Ganti Pencarian"
					bold
					onPress={() => this.props.research()}>
				</Button>
			</View>
		)
	}

	goToKetentuanCovid = () => {
		let url = "https://www.klikindomaret.com/page/info-tiket-kai"
		deeplink({
			componentId: this.props.componentId,
			url: url,
			title: 'Travel Klik Indomaret'
		})
	}

    render() {
		let { step, Passengers, DepartureTicket, ReturnTicket, ReturnTrip } = this.props
		let { isLoading, Schedules, Adult, Infant, showErrorPassenger, showPassengerCategoryChange } = this.state
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
								<Text style={[textStyles.bold, textStyles.grey, textStyles.xLarge]}>{`Kereta ${step == 2 ? 'Pulang' : 'Pergi'}`}</Text>
								<View style={layoutStyles.rowCenterVertical}>
									<Image source={require('../../assets/travel/User.png')} style={{ tintColor: 'black', width: 15, height: 15, resizeMode: 'contain' }}/>
									<Text style={{ marginLeft: 10 }}>{Adult} Dewasa{ Infant ? `, ${Infant} Bayi` : ''}</Text>
									{/* {Child ? `, ${Child} Anak` : ''} */}
								</View>
							</SpaceBetween>
						) : null
					}
					<View style={styles.boxBlue}>
						<TouchableWithoutFeedback onPress={() => this.goToKetentuanCovid()}>
							<View style={[layoutStyles.rowCenterVertical]}>
								<Image source={require('../../assets/travel/Info.png')} style={{ marginRight: 10, height: 32, width: 32 }}/>
								<Text style={{flex: 1}}>
									<Text style={[textStyles.small, { color: "#313131", marginLeft: 10 }]}>Cegah penyebaran COVID-19 selama perjalanan kereta api, cek syarat & ketentuannya </Text>
									<Text style={[textStyles.small, { color: "#0079C2"}]}>di sini</Text>
								</Text>
							</View>
						</TouchableWithoutFeedback>
					</View>
					{
						showPassengerCategoryChange ? (
							<View style={styles.box}>
								<View style={layoutStyles.rowCenterVertical}>
									<Image source={require('../../assets/travel/Info-blue.png')} style={{ tintColor: TRAVEL_ORANGE, marginRight: 10 }}/>
									<Text style={[textStyles.small, textStyles.orange, { marginLeft: 10, flex: 1, marginRight: 10 }]}>Sesuai dengan ketentuan PT KAI, penumpang berumur 3+ tahun adalah kategori Dewasa</Text>
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
												<Image style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 4 }} source={require('../../assets/travel/Ilustrasi/NoTrainsR1.png')} />
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
                    isVisible={this.state.showDetailModal}
                    onBackButtonPress={() => this.setState({ showDetailModal: false })}
                    onBackdropPress={() => this.setState({ showDetailModal: false })}
                    style={modalStyles.popUp}>
                    <View style={[modalStyles.popUpDetail, { paddingBottom: 0 }]}>
                        <View style={modalStyles.popUpHeader}>
                            <TouchableOpacity onPress={() => this.setState({ showDetailModal: false })}>
                                <Image style={{ width: 15, height: 15, tintColor: 'black' }} source={require('../../assets/travel/Close.png')} />
                            </TouchableOpacity>
                            <View>
                                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700', marginLeft: 20 }}>Penumpang</Text>
                            </View>
                        </View>
                        {this.renderDetail()}
                    </View>
                </Modal>

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
	boxBlue: {
        borderRadius: 10,
        backgroundColor: "#E1EEFF",
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