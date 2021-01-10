import React, { Component } from 'react';
import { Image, TouchableOpacity, Dimensions, Text, View, SafeAreaView, Platform, StyleSheet, ScrollView, BackHandler, Alert } from 'react-native';
import { blue, yellow, softgrey, grey, URL_PAYMENT_CENTER, KAI_TRAVEL_API_URL, windowHeight, screenHeight, windowWidth, orange } from '../../libs/Constants';
import SpaceBetween from '../../components/SpaceBetween';
import AutoHeightImage from 'react-native-auto-height-image'
import { travelAPI } from '../../libs/api';
import { pushScreen, resetScreen, isIphoneXorAbove, popScreen } from '../../libs/navigation';
import { Navigation } from 'react-native-navigation';
import moment from 'moment';
import Rupiah from '../../libs/Rupiah';
import Button from '../../components/Button';
import Dash from 'react-native-dash';
import TravelCountdown from '../../libs/TravelCountdown';
import TravelLoading from '../../components/TravelLoading';
import getItem from '../../libs/getItem';
import Modal from "react-native-modal";
import { FLIGHT_TRAVEL_API_URL, marginStyles, textStyles, layoutStyles, SCREEN_WIDTH, TRAVEL_BLUE, TRAVEL_API_URL } from '../../libs/Travel/TravelConstants';

export default class extends Component {
	static options(passProps) {
		return {
			topBar: {
				background: {
					color: yellow
				},
				title: {
                    text: 'Konfirmasi Pesanan',
					alignment: 'center',
					fontWeight: 'bold',
				},
				leftButtons: [
					{
						id: 'btnBack',
						icon: require('../../assets/back_arrow.png')
					}
				],
				elevation: 0
			}
		}
	}

	constructor(props) {
		super(props);
		this.state = {
			isLoading: true,
			openSummaryDetail: false,
			openTripDetail : false,
			CouponList: [],

			showExpiredBookingModal: false,
			SummaryData: null
		}
		Navigation.events().bindComponent(this)
    }
	
	backtoHome() {
		this.setState({ showExpiredBookingModal: false })
        resetScreen('HomeStack', 'Home', { routingPage: 'TravelHome' })
    }
	
    handleBack = () => {
		let { SalesOrderHeaderID } = this.props
		Alert.alert('Perhatian', 'Anda ingin membatalkan pesanan?', [{
			text: 'Ok',
			onPress: () => {
				let url = `${FLIGHT_TRAVEL_API_URL}Booking/Cancel/?SalesOrderHeaderID=${SalesOrderHeaderID}`
				travelAPI(url, 'GET', null, (response) => {
					resetScreen('HomeStack', 'Home', {
						routingPage: 'TravelHome'
					})
				}, true)
			}
		}, {
			text: 'Batal'
		}])
    }

	navigationButtonPressed({ buttonId }) {
		this.handleBack()
	}

	componentdidAppear(){
		BackHandler.addEventListener('hardwareBackPress', this.handleBack);
	}

	componentWillMount(){
		BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
	}

	getData = () => {
		let { SalesOrderHeaderID } = this.props
		this.setState({ isLoading: true })
		let url = `${TRAVEL_API_URL}Payment/GetSummaryBySalesOrderHeaderID/${SalesOrderHeaderID}`
		travelAPI(url, 'GET', null, (response) => {
			if (response) {
                // response.Data.ExpiredInMinute = 10
				this.setState({ SummaryData: response.Data, CouponList: response.Data.CouponDiscount })
			}
			this.setState({ isLoading: false })
		})
	}

	componentDidMount() {
		this.getData()
	}

	useCoupon = () => {
		getItem('UserProfile', (UserProfile) => {
			let { SalesOrderHeaderID } = this.props
			pushScreen(this.props.componentId, 'KodeKupon', {
				fromScreen: 'kai',
				data: { SalesOrderHeaderID, UserProfile },
				updateListCoupon: (CouponList) => {
					this.setState({ CouponList }, () => {
						this.getData()
					})
				}
			})
		})
	}

	renderSummaryDetail(){
		let { CouponList, SummaryData } = this.state
        let { Discount, GrandTotalBeforeVoucher, TotalAdultPassenger, TotalChildPassenger, TotalInfantPassenger, PriceAdult, PriceChild, PriceInfant, ExtraFee, BaggagePrice, MealPrice } = SummaryData
		return (	
			<View style={styles.summaryDetailContainer}>

				<Text style={[styles.summaryText, styles.bold]}>Harga Tiket Pesawat</Text>

				<SpaceBetween style={styles.summaryItems}>
					<Text style={[styles.summaryText, styles.summaryLevelOne]}>Dewasa ({TotalAdultPassenger} x {Rupiah(PriceAdult)})</Text>
					<Text style={[styles.summaryText, styles.bold]}>{Rupiah(PriceAdult*TotalAdultPassenger)}</Text>
				</SpaceBetween>

                {TotalChildPassenger > 0 ? 
					<SpaceBetween style={styles.summaryItems}>
						<Text style={[styles.summaryText, styles.summaryLevelOne]}>Anak ({TotalChildPassenger} x {Rupiah(PriceChild)})</Text>
						<Text style={[styles.summaryText, styles.bold]}>{Rupiah(PriceChild*TotalChildPassenger)}</Text>
					</SpaceBetween>
					: null
				}

				{TotalInfantPassenger > 0 ? 
					<SpaceBetween style={styles.summaryItems}>
						<Text style={[styles.summaryText, styles.summaryLevelOne]}>Bayi ({TotalInfantPassenger} x {Rupiah(PriceInfant)})</Text>
						<Text style={[styles.summaryText, styles.bold]}>{Rupiah(PriceInfant*TotalInfantPassenger)}</Text>
					</SpaceBetween>
					: null
				}

                {
                    BaggagePrice > 0 ? (
                        <SpaceBetween style={styles.summaryItems}>
                            <Text style={styles.summaryText}>Biaya Bagasi :</Text>
                            <Text style={[styles.summaryText, styles.bold]}>{Rupiah(BaggagePrice)}</Text>
                        </SpaceBetween>
                    ) : null
                }

                {
                    MealPrice > 0 ? (
                        <SpaceBetween style={styles.summaryItems}>
                            <Text style={styles.summaryText}>Biaya Makanan :</Text>
                            <Text style={[styles.summaryText, styles.bold]}>{Rupiah(MealPrice)}</Text>
                        </SpaceBetween>
                    ) : null
                }

				<SpaceBetween style={styles.summaryItems}>
					<Text style={styles.summaryText}>Biaya Layanan :</Text>
					<Text style={[styles.summaryText, styles.bold]}>{Rupiah(ExtraFee)}</Text>
				</SpaceBetween>

				<Dash style={[styles.summaryItems, styles.separator]} dashGap={4} dashLength={3} dashColor={'darkgrey'} dashThickness={1} />

				<SpaceBetween style={styles.summaryItems}>
					<Text style={[styles.summaryText, styles.bold]}>Subtotal :</Text>
					<Text style={[styles.summaryText, styles.bold]}>{Rupiah(GrandTotalBeforeVoucher)}</Text>
				</SpaceBetween>

				<Dash style={[styles.summaryItems, styles.separator]} dashGap={4} dashLength={3} dashColor={'darkgrey'} dashThickness={1} />

				{
					CouponList.length > 0 ? (
						<View>
							<SpaceBetween style={styles.summaryItems}>
								<Text style={styles.summaryText}>Potongan Promosi :</Text>
								{Discount > 0 ? (<Text style={[styles.summaryText, styles.bold]}>({Rupiah(Discount)})</Text>) : null}
							</SpaceBetween>
							{
								CouponList.map((coupon, i) => {
									return (
										<SpaceBetween style={styles.summaryItems} key={i}>
											<Text style={[styles.summaryText, styles.summaryLevelOne, styles.grey]}>Kupon {coupon.CouponMappingCode}</Text>
											{coupon.DiscountCoupon ? (<Text style={[styles.summaryText, styles.grey]}>{Rupiah(coupon.DiscountCoupon)}</Text>) : null}
										</SpaceBetween>
									)
								})
							}
							<Dash style={[styles.summaryItems, styles.separator]} dashGap={4} dashLength={3} dashColor={'darkgrey'} dashThickness={1} />
						</View>
					) : null
				}
			</View>
		)
	}

	confirmPayment = () => {
		let { SalesOrderHeaderID } = this.props
		pushScreen(this.props.componentId, 'PaymentCenter', {
			uri: `${URL_PAYMENT_CENTER}?pcid=travel-v2&trxtype=createorder&SCTPCID=${SalesOrderHeaderID}`
		})
	}

	renderTripSummary = (TripData) => {
		let multiCarrierCheck = () => {
			let isMultiCarrier = false
			let carrierCode = TripData[0].TrainNo.substring(0,2)
			TripData.forEach(e => {
				let { TrainNo } = e
				let localCarrierCode = TrainNo.substring(0,2)
				if(carrierCode == localCarrierCode) isMultiCarrier = false
				else isMultiCarrier = true
			})
			return isMultiCarrier
        }
        let isMultiCarrier = multiCarrierCheck()
		let tripLength = TripData.length
		let { originStation, DepartureDate, journeyInfo, IconUrl, TrainName } = TripData[0]
		let { destinationStation, ArrivalDate } = TripData[tripLength-1]
		return (
			<View>
				<View style={[styles.row, {flex: 1, justifyContent: 'flex-start'}]}>
					<AutoHeightImage
						width={50}
						source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : { uri: IconUrl }} 
						style={{ alignSelf: 'flex-start' }} />
						<View style={{ marginLeft: 5 }}>
							<Text style={[textStyles.bold, textStyles.small]} numberOfLines={1}>{isMultiCarrier ? 'Multi-Maskapai' : TrainName}</Text>
							<View style={layoutStyles.rowCenterVertical}>
							{
								TripData.map((Trip, i) => {
									return (
										<Text style={[textStyles.xSmall, textStyles.grey]}>{`${Trip.TrainNo}${i < TripData.length-1 ? ', ' : ''}`}</Text>
									)
								})
							}
							</View>
						<View style={[styles.row, styles.summaryItems, {flex: 1, justifyContent: 'flex-start', marginTop: 10}]}>
							<View style={{ alignItems: 'center' }}>
								<Text style={[styles.textSmall, styles.grey]}>{originStation.Code}</Text>
								<Text style={[styles.textSmall]}>{moment(DepartureDate).locale('id').format('HH:mm')}</Text>
							</View>
							<View style={{ alignItems: 'center', marginHorizontal: 10 }}>
								<Text style={[styles.textSmall, styles.grey ,{ marginBottom: 5 }]}>{moment.utc().startOf('day').add({ minutes: journeyInfo.journeyTime }).format('HH[j] mm[m]')}</Text>
								<View style={{ borderBottomWidth: 1, borderBottomColor: 'grey', height: 1, width: 100 }} />
							</View>
							<View style={{ alignItems: 'center' }}>
								<Text style={[styles.textSmall, styles.grey]}>{destinationStation.Code}</Text>
								<Text style={[styles.textSmall]}>{moment(ArrivalDate).locale('id').format('HH:mm')}</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}

	renderTripDetail = (TripData) => {
		let multiCarrierCheck = () => {
			let isMultiCarrier = false
			let carrierCode = TripData[0].TrainNo.substring(0,2)
			TripData.forEach(e => {
				let { TrainNo } = e
				let localCarrierCode = TrainNo.substring(0,2)
				if(carrierCode == localCarrierCode) isMultiCarrier = false
				else isMultiCarrier = true
			})
			return isMultiCarrier
        }
		let isMultiCarrier = multiCarrierCheck()
		let tripLength = TripData.length
		let { TrainName, IconUrl } = TripData[0]
		return (
			<View>
				<View style={styles.item}>
					<SpaceBetween>
						<View style={styles.row}>
						<AutoHeightImage
							width={60}
							source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : { uri: IconUrl }} 
							style={{ alignSelf: 'flex-start' }} />
							<View style={{ marginLeft: 5 }}>
								<Text style={[textStyles.bold, textStyles.large]} numberOfLines={1}>{isMultiCarrier ? 'Multi-Maskapai' : TrainName}</Text>
								<View style={layoutStyles.rowCenterVertical}>
								{
									TripData.map((Trip, i) => {
										return (
											<Text style={[textStyles.medium, textStyles.grey]}>{`${Trip.TrainNo}${i < tripLength-1 ? ', ' : ''}`}</Text>
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
					TripData.map((Trip, i) => {
						let { originStation, destinationStation, DepartureDate, ArrivalDate, FlyTime, LayOver, IconUrl, TrainName, TrainNo } = Trip
						return (
							<View>
								<View style={layoutStyles.row}>
									<View style={{ flex: 3, marginRight: 10 }}>
										<View>
											<Text style={[textStyles.xSmall, textStyles.alignRight]}>{DepartureDate.split('T')[1].substring(0, 5)}</Text>
											<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{moment(DepartureDate).locale('id').format('DD MMM YYYY')}</Text>
										</View>

										<View style={{ marginTop: 30 }}>
											<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{moment.utc().startOf('day').add({ minutes: FlyTime }).format('HH[j] mm[m]')}</Text>
										</View>

										<View style={{ marginTop: 27 }}>
											<Text style={[textStyles.xSmall, textStyles.alignRight]}>{ArrivalDate.split('T')[1].substring(0, 5)}</Text>
											<Text style={[textStyles.xSmall, textStyles.alignRight, textStyles.grey]}>{moment(ArrivalDate).locale('id').format('DD MMM YYYY')}</Text>
										</View>
									</View>

									<View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
										<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: 'grey', backgroundColor: 'white', zIndex: 1 }} />
										<View style={{ borderLeftWidth: 1, borderLeftColor: 'grey', height: 100}} />
										<View style={{ width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: TRAVEL_BLUE, backgroundColor: TRAVEL_BLUE, zIndex: 1 }} />
									</View>

									<View style={{ flex: 6, marginLeft: 10 }}>
										<View>
											<Text style={[textStyles.xSmall]}>{`${originStation.City} (${originStation.Code})`}</Text>
											<Text style={[textStyles.xSmall, textStyles.grey]}>{originStation.Name}</Text>
										</View>

										{
											tripLength > 1 ? (
												<View style={[layoutStyles.rowCenterVertical, { marginTop: 30 }]}>
													<View style={{ marginRight: 5 }}>
														<Text style={[textStyles.xSmall]}>{TrainName}</Text>
														<Text style={[textStyles.xSmall, textStyles.alignLeft, textStyles.grey]}>{TrainNo}</Text>
													</View>
													<AutoHeightImage
														width={40}
														source={isMultiCarrier ? require('../../assets/travel/flight/multi-carrier.png') : { uri: IconUrl }} />
												</View>
											) : null
										}

										<View style={{ marginTop: tripLength > 1 ? 27 : 70 }}>
											<Text style={[textStyles.xSmall]}>{`${destinationStation.City} (${destinationStation.Code})`}</Text>
											<Text style={[textStyles.xSmall, textStyles.grey]}>{destinationStation.Name}</Text>
										</View>
									</View>
								</View>
								{
									i < tripLength-1 ? (
										<View style={[layoutStyles.rowCenterVertical, marginStyles.paddingSmall, marginStyles.itemLarge, { backgroundColor: softgrey, width: SCREEN_WIDTH / 3, marginLeft: SCREEN_WIDTH/8 }]}>
											<Image style={{ marginEnd: 10, overflow: 'visible', width: 15, height: 15 }} source={require('../../assets/travel/Timer-blue.png')}/>
											<Text style={[textStyles.small, textStyles.black]}>Transit {moment.utc().startOf('day').add({ minutes: LayOver }).format('hh[j] m[m]')}</Text>
										</View>
									) : null
								}
							</View>
						)
					})
				}
			</View>
		)
	}

	renderPassengerDetail = (Passenger, i) => {
		let { Sallutation, Name, Maturity } = Passenger
		if(Sallutation == 0) Sallutation = 'Tn.'
		else if(Sallutation == 1) Sallutation = 'Ny.'
        else Sallutation = 'Nn.'
        if(Maturity == 0) Maturity = 'Dewasa'
        else if(Maturity == 1) Maturity = 'Bayi'
        else if(Maturity == 2) Maturity = 'Anak'
		return (
			<Text style={[textStyles.large, marginStyles.itemLarge]} key={i}>{i+1}. {Sallutation} {Name} ({Maturity})</Text>
		)
	}

	render() {
		let { openSummaryDetail, isLoading, CouponList, openTripDetail, SummaryData } = this.state
		return (
			<SafeAreaView style={{ flex: 1, zIndex: 2 }}>
				<View style={{ backgroundColor: '#E1EEFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <Image style={{ marginEnd: 5, overflow: 'visible', width: 15, height: 15 }} source={require('../../assets/travel/Timer-blue.png')}></Image>
                    <Text style={{ color: blue }}>Sisa Waktu Pemesanan: </Text>
					{
						SummaryData ? (<TravelCountdown type={'text'} onTimeout={() => this.setState({ showExpiredBookingModal: true })} minutes={SummaryData.ExpiredInMinute} seconds={SummaryData.ExpiredInSecond} color={blue} /> ) : null
					}
                </View>
				<ScrollView style={{ flex: 1, backgroundColor: softgrey }} showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
					<View style={[styles.section,{ marginTop: 20 }]}>
						<Text style={styles.sectionHeader}>Ringkasan Perjalanan</Text>
						{isLoading ? <TravelLoading page={'orderconfirmation'}/> : (
							<View style={[layoutStyles.card]}>
								<SpaceBetween>
									<Text style={marginStyles.bottomSmall}>Pergi</Text>
									<TouchableOpacity onPress={() => this.setState({ openTripDetail: !openTripDetail })}>
										<Image style={{width:16, height:10, tintColor:blue, transform: [{ rotate: openTripDetail ? '0deg' : '180deg'}]}} source={require('../../assets/top_arrow.png')} />
									</TouchableOpacity>
								</SpaceBetween>
								{openTripDetail ? null : this.renderTripSummary(SummaryData.BookingPergi)}
								{openTripDetail ? this.renderTripDetail(SummaryData.BookingPergi) : null}
								{SummaryData && SummaryData.BookingPulang ? (
									<View>
										<View style={[marginStyles.itemLarge, { borderWidth: 1, borderColor: softgrey, height: 1 }]}></View>
										<Text style={marginStyles.bottomSmall}>Pulang</Text>
										{openTripDetail ? null : this.renderTripSummary(SummaryData.BookingPulang)}
										{openTripDetail ? this.renderTripDetail(SummaryData.BookingPulang) : null}
									</View>
								) : null}
							</View>
						)}
					</View>
					<View style={styles.section}>
						<Text style={styles.sectionHeader}>Rincian Penumpang</Text>
						{isLoading ? <TravelLoading page={'passengerconfirmation'}/> : (
							<View style={[layoutStyles.card, { paddingVertical: 10 }]}>
								{SummaryData.passenger.map(this.renderPassengerDetail)}
							</View>
						)}
					</View>
				</ScrollView>

				{ openSummaryDetail ? (
						<TouchableOpacity onPress={()=> this.setState({ openSummaryDetail: false })} style={{position:'absolute', backgroundColor:'rgba(0,0,0,0.5)', top:0, width: windowWidth, height: isIphoneXorAbove() ? (windowHeight - (windowHeight/4)) : windowHeight}}/>
					) : null
				}
				{
					openSummaryDetail ? this.renderSummaryDetail() : null 
				}
				<View style={[openSummaryDetail ? null : styles.shadowTop, { backgroundColor: 'white', padding: 15, paddingTop: 5 }]}>
					<TouchableOpacity style={{ marginBottom: 15, marginTop: openSummaryDetail ? 5 : 10 }} onPress={() => SummaryData ? this.setState({ openSummaryDetail: !openSummaryDetail }) : null}>
						<SpaceBetween>
							<SpaceBetween>
								<Image style={{width:16, height:10, tintColor:blue, marginRight:10, transform: [{ rotate: openSummaryDetail ? '180deg' : '0deg'}]}} source={require('../../assets/top_arrow.png')} />
								<Text style={styles.summaryTitle}>Total Pembayaran</Text>
							</SpaceBetween>
							{ isLoading ? (<TravelLoading page={'single'} loadWidth={'30%'}/>) : (<Text style={[styles.summaryTitle, { color: orange }]}>{Rupiah(SummaryData.GrandTotal)}</Text>) }
						</SpaceBetween>
					</TouchableOpacity>
					
					<TouchableOpacity onPress={this.useCoupon}>
						<View style={{ backgroundColor: '#eaffec', flexDirection: 'row', padding: 5, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'space-between', borderRadius: 5 }}>
							<Text style={{ marginVertical: 5, color: 'green' }}>Gunakan Kode Kupon</Text>
							<View>
								<Image
									style={{ width: 27, height: 21, tintColor: 'green', marginRight: CouponList.length > 0 ? 10 : 5 }}
									source={require('../../assets/kupon_green.png')} />
								{CouponList.length > 0 ? (
									<View style={{ position: 'absolute', right: 0, bottom: 5, width: '100%', backgroundColor: orange, width: 20, height: 20, borderRadius: 25 / 2, alignItems: 'center', justifyContent: 'center' }}>
										<Text style={[styles.textSmall, { color: 'white' }]}>{CouponList.length}</Text>
									</View>
								) : null}
							</View>
						</View>
					</TouchableOpacity>
				</View>
				<Button
					style={{ backgroundColor: isLoading ? 'lightgrey' : blue, width: windowWidth, marginTop: 0, borderRadius: 0 }}
					text="Bayar Sekarang"
					onPress={() => isLoading ? null : this.confirmPayment()}>
				</Button>

				<Modal
                    isVisible={this.state.showExpiredBookingModal}
                    style={styles.popUp}>
                    <View style={styles.popUpDetail}>
                        <AutoHeightImage style={styles.modalImage} width={windowWidth / 2} source={require('../../assets/travel/Ilustrasi/WaktuHabis-R1.png')} />
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 18, color: 'black', margin: 8 }}>Waktu pemesanan Anda telah habis</Text>
                            <Text style={{ color: grey, textAlign: 'center', paddingHorizontal: 20, margin: 8 }}>Pemesanan tiket Anda telah kadaluarsa, silahkan kembali ke Beranda untuk mengulangi proses pemesanan Anda.</Text>
                            <Button
                                style={{ backgroundColor: blue, width: windowWidth, paddingBottom: isIphoneXorAbove() ? 30 : null, borderRadius: 0 }}
                                text="Kembali ke Beranda"
                                onPress={() => this.backtoHome()}>
                            </Button>
                        </View>
                    </View>
                </Modal>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	item: {
		marginVertical: 10
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center"
	},
	text: {
		margin: 3,
		marginLeft: 0
	},
	textLarge: {
		fontSize: 13,
		flexWrap: 'wrap'
	},
	bold: {
		fontWeight: "bold"
	},
	textSmall: {
		fontSize: 11,
		flexWrap: "wrap"
	},
	textRight: {
		textAlign: 'right'
	},
	grey: {
		color: 'grey'
	},
	separator: {
		height: .5
	},
	modalImage: {
        alignSelf: 'center',
        margin: 20
    },
	section: {
		flex: 1,
		margin: 20,
		marginTop: 0
	},
	sectionHeader:{
		fontWeight: 'bold',
		color: 'gray'
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: 'bold'
	},
	summaryText: {
		fontSize: 12,
	},
	summaryLevelOne: {
		marginLeft: 10
	},
	summaryDetailContainer: {
		backgroundColor: 'white',
		padding: 15,
		paddingLeft: 30,
		paddingBottom: 0,
		borderTopRightRadius: 5,
		borderTopLeftRadius: 5
	},
	summaryItems: {
		marginVertical: 5
	},
    passengerAlignLeft: {
        flex: 1,
        alignSelf: 'flex-start'
    },
    passengerAlignRight: {
        flex: 9,
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
	},
	alignLeft: {
        flex: 1,
        alignSelf: 'flex-start'
    },
    alignRight: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
	},
	popUp: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    popUpDetail: {
        backgroundColor: 'white',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
	},
	shadowTop: {
		shadowColor: "#000000",
		shadowOffset: { width: 0.1, height: 1 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		// borderTopWidth: Platform.OS === 'android' ? 1 : 0,
		// borderTopColor: 'lightgrey',
	}
});