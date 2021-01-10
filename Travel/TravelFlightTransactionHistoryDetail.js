import moment from 'moment';
import React, { Component } from 'react';
import { Clipboard, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AutoHeightImage from 'react-native-auto-height-image';
import Dash from 'react-native-dash';
import Modal from 'react-native-modal';
import { Navigation } from 'react-native-navigation';
import Button from '../../components/Button';
import SpaceBetween from '../../components/SpaceBetween';
import { travelAPI } from '../../libs/api';
import { black, blue, grey, orange, softgrey } from '../../libs/Constants';
import { isIphoneXorAbove, popScreen, resetScreen } from '../../libs/navigation';
import notif from '../../libs/notif';
import Rupiah from '../../libs/Rupiah';
import setItem from '../../libs/setItem';
import { layoutStyles, marginStyles, textStyles, TRAVEL_API_URL } from '../../libs/Travel/TravelConstants';
import TravelCountdown from '../../libs/TravelCountdown';

let { width, height } = Dimensions.get('window')

const STATUS = {
    WAITING: {
        CODE: 0,
        COLOR: '#FFE3C7',
        TEXT: 'Konfirmasi Pembayaran',
        TEXTCOLOR: '#F28418'
    },
    SUCCESS: {
        CODE: 2,
        COLOR: '#DEF7E3',
        TEXT: 'Transaksi Berhasil',
        TEXTCOLOR: '#00850C'
    },
    FAILED: {
        CODE: 8,
        COLOR: '#FFDCDC',
        TEXT: 'Transaksi Gagal',
        TEXTCOLOR: '#CC3333'
    },
    REFUND: {
        CODE: 28,
        COLOR: '#FFE3C7',
        TEXT: 'Pengembalian Dana',
        TEXTCOLOR: '#F28418'
    },
}

export default class extends Component {
    static options(passProps) {
        return {
            topBar: {
                background: {
                    color: 'white'
                },
                title: {
                    component: {
                        name: 'TravelTransactionHistoryDetailTitle',
                        alignment: 'fill',
                        passProps: {
                            type: 'Pesawat'
                        }
                    }
                },
                leftButtons: [
					{
						id: 'btnBack',
						icon: require('../../assets/back_arrow.png')
					}
				],
            }
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            isTimeout: false,
            showPaymentDetailModal: false,
            ...props
        }
        Navigation.events().bindComponent(this)
    }

    navigationButtonPressed({ buttonId }) {
        this.handleBack()
    }

    componentDidAppear() {
        this.getData()
    }

    handleBack = () => {
        let { isFromThankYou, onBack } = this.props
        popScreen(this.props.componentId)
        if(isFromThankYou){
            onBack && onBack()
        }
    }

    backtoHome = () => {
        resetScreen('HomeStack', 'Home', { routingPage: 'TravelHome' })
    }

    getData = () => {
		let { SalesOrderHeaderId } = this.props
		let url = `${TRAVEL_API_URL}SalesOrder/GetSalesOrderBySalesOrderHeaderIDCustom/${SalesOrderHeaderId}`;
		this.setState({ isLoading: true })
		travelAPI(url, "GET", null, response => {
			this.setState({ isLoading: false })
			let { Code, Data } = response
			if(Code == '00'){
				this.setState({ ...Data })
			}
		}, false);
	}

    reOrder = (isReorder=false, SalesOrder=undefined) => {
        let { onAction } = this.props
        if(onAction) {
            if(isReorder){
                let { JourneyType } = this.state
                let ReturnTrip = JourneyType == 'RoundTrip' ? true : false
                let { BookingKAI } = SalesOrder
                let { originStation, destinationStation, TotalAdultPassenger } = BookingKAI
                let Origin1 = {
                    City: originStation.City,
                    Code: originStation.Code,
                    Name: originStation.Name,
                    Country: originStation.Country,
                    Type: originStation.Type,
                    CityCode: originStation.CityCode
                }
                let Destination1 = {
                    City: destinationStation.City,
                    Code: destinationStation.Code,
                    Name: destinationStation.Name,
                    Country: destinationStation.Country,
                    Type: destinationStation.Type,
                    CityCode: destinationStation.CityCode
                }
                setItem('TravelSearchPreferences', {ReturnTrip, MultiCity: false, DepartureDate: moment().add(1, 'days').format('MM/DD/YYYY'), ReturnDate: moment().add(3, 'days').format('MM/DD/YYYY'), Adult: TotalAdultPassenger, Child: 0, Infant: 0, Origin1, Destination1})
            }
            this.props.onAction(isReorder, SalesOrder)
        }
        else{
            Alert.alert('KlikIndomaret', 'Mohon maaf terjadi kesalahan. Silahkan lakukan pencarian ulang di halaman Travel KlikIndomaret ya, Sobat!', [{
                text: 'Batal'
            }, {
                text: 'Cari',
                onPress: () => this.backtoHome()
            }])
        }
    }

    renderSO = (SO, i) => {
        let { SalesOrderHeaderId, SalesOrderNo, Booking, TravelType, ShippingStatus, PaymentStatus } = SO
        if(TravelType == 'train') TravelType = 'Kereta'
        else if(TravelType == 'flight') TravelType = 'Pesawat'
        let color = STATUS.FAILED.TEXTCOLOR
        let shippingStatusText = 'telah'
        if(ShippingStatus == STATUS.SUCCESS.CODE){
            color = STATUS.SUCCESS.TEXTCOLOR
        } 
        else if(ShippingStatus == STATUS.WAITING.CODE) {
            shippingStatusText = 'belum'
        }
        else shippingStatusText = 'gagal'
        return Booking.map((e, i) => {
            let { Passenger, originStation, destinationStation, DepartureDate, ArrivalDate, TrainName, TrainNo, IconUrl } = e
            return (
                <View style={[styles.card]} key={i}>
                    <View style={[styles.row, styles.cardSection, { backgroundColor: softgrey }]}>
                        <Text style={styles.black}>Pesanan <Text style={[styles.bold, styles.black]}>#{SalesOrderNo}</Text></Text>
                    </View>
                    <View style={styles.cardContentContainer}>
                        {
                            PaymentStatus == STATUS.SUCCESS.CODE && ShippingStatus != STATUS.FAILED.CODE ? (
                                <View style={{ alignSelf: 'flex-end', borderRadius: 10, borderColor: color, borderWidth: 2, padding: 3 }}>
                                    <Text style={[styles.bold, { color: color, fontSize: 10 }]}>Tiket {shippingStatusText} terbit</Text>
                                </View>
                            ) : null
                        }
                        <View style={[styles.row, { margin: 20 }]}>
                            <AutoHeightImage width={50} source={{ uri: IconUrl }} style={{ marginRight: 50 }}></AutoHeightImage>
                            <View style={styles.row}>
                                <AutoHeightImage width={15} source={require('../../assets/travel/Plane-grey.png')} style={{ tintColor: black, marginRight: 10 }}></AutoHeightImage>
                                <Text style={[styles.textLarge, styles.black]}>{originStation.City}</Text>
                                <Image
                                    source={require('../../assets/travel/Single-trip.png')}
                                    style={{ marginHorizontal: 5, tintColor: 'black' }} />
                                <Text style={[styles.textLarge, styles.black]}>{destinationStation.City}</Text>
                            </View>
                        </View>
                        <View>
                            <View style={[styles.row, styles.item]}>
                                <Text style={[styles.textSmall, styles.alignLeft, styles.grey]}>Keberangkatan</Text>
                                <View style={[styles.alignRight]}>
                                    <Text style={[styles.bold, styles.textLarge, styles.black]}>{originStation.Name} ({originStation.Code})</Text>
                                    <Text style={[styles.text, styles.textSmall, styles.black]}>{moment(DepartureDate).format('dddd, DD MMMM YYYY | HH:mm [WIB]')}</Text>
                                </View>
                            </View>
                            <View style={[styles.row, styles.item]}>
                                <Text style={[styles.textSmall, styles.alignLeft, styles.grey]}>Kedatangan</Text>
                                <View style={[styles.alignRight]}>
                                    <Text style={[styles.bold, styles.textLarge, styles.black]}>{destinationStation.Name} ({destinationStation.Code})</Text>
                                    <Text style={[styles.text, styles.textSmall, styles.black]}>{moment(ArrivalDate).format('dddd, DD MMMM YYYY | HH:mm [WIB]')}</Text>
                                </View>
                            </View>
                            <View style={[styles.row, styles.item]}>
                                <Text style={[styles.textSmall, styles.alignLeft, styles.grey]}>Maskapai</Text>
                                <Text style={[styles.alignRight, styles.bold, styles.textLarge, styles.black]}>{TrainName}<Text style={[textStyles.normal, textStyles.small]}> ({TrainNo})</Text></Text>
                            </View>
                        </View>
        
                        <View style={[styles.passengercard, styles.item]}>
                            <Text style={[styles.text, styles.textSmall, { color: grey, marginBottom: 10 }]}>Rincian Penumpang</Text>
                            {
                                Passenger.map((el, j) => {
                                    let { Sallutation, Name, Maturity } = el
                                    if(Sallutation == 0) Sallutation = 'Tn.'
                                    else if(Sallutation == 1) Sallutation = 'Ny.'
                                    else Sallutation = 'Nn.'
                                    if(Maturity == 0) Maturity = 'Dewasa'
                                    else if(Maturity == 1) Maturity = 'Bayi'
                                    else Maturity = 'Anak'
                                    return (
                                        <View key={j}>
                                            {/* <View style={[layoutStyles.row, (j != 0 && j != Passenger.length-1) ? marginStyles.itemLarge : null]}> */}
                                            <View style={[styles.row, marginStyles.itemLarge]}>
                                                <Text style={[textStyles.bold, textStyles.medium, styles.passengerAlignLeft]}>{j+1}.</Text>
                                                <View style={styles.passengerAlignRight}>
                                                    <Text style={[textStyles.bold, textStyles.medium, textStyles.black, textStyles.wrap]} numberOfLines={1}>{Sallutation} {Name} ({Maturity})</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )
                                })
                            }
                        </View>
                    </View>
                </View>
            )
        })
    }

    render() {
        let { BookingTotal, PaymentStatus, ShippingStatus, SalesOrderDate, SalesOrder, OrderStatus, SubTotalPrice, BaggageFee, MealFee, isTimeout } = this.state
        let { CouponMappingCode, PaymentType, Payment, Booking, IsButtonCopyShow } = SalesOrder[0]
        let { PriceAdult, PriceChild, PriceInfant, TotalAdultPassenger, TotalChildPassenger, TotalInfantPassenger, SubTotalBrutoAdult, SubTotalBrutoChild, SubTotalBrutoInfant } = Booking[0]
        let color = STATUS.WAITING.COLOR
        let textColor = STATUS.WAITING.TEXTCOLOR
        let text = STATUS.WAITING.TEXT
        let icon = require('../../assets/travel/Status-Waiting.png')
        if(PaymentStatus == STATUS.SUCCESS.CODE && ShippingStatus == STATUS.FAILED.CODE){
            color = STATUS.REFUND.COLOR
            icon = require('../../assets/travel/Status-Refund.png')
            text = STATUS.REFUND.TEXT
            textColor = STATUS.REFUND.TEXTCOLOR
        }
        else if(PaymentStatus == STATUS.SUCCESS.CODE && ShippingStatus == STATUS.WAITING.CODE){
            text = 'Proses'
        }
        else if (PaymentStatus == STATUS.SUCCESS.CODE) {
            color = STATUS.SUCCESS.COLOR
            icon = require('../../assets/travel/Status-Success.png')
            text = STATUS.SUCCESS.TEXT
            textColor = STATUS.SUCCESS.TEXTCOLOR
        }
        else if(PaymentStatus == STATUS.WAITING.CODE){
            color = STATUS.WAITING.COLOR
            icon = require('../../assets/travel/Status-Waiting.png')
            text = STATUS.WAITING.TEXT
            textColor = STATUS.WAITING.TEXTCOLOR
        }
        else {
            color = STATUS.FAILED.COLOR
            icon = require('../../assets/travel/Status-Failed.png')
            text = STATUS.FAILED.TEXT
            textColor = STATUS.FAILED.TEXTCOLOR
        }
        let totalServiceFee = SalesOrder[0].SalesOrderDetail[0].PPN
        if(SalesOrder[1]){
            totalServiceFee += SalesOrder[1].SalesOrderDetail[0].PPN
        }
        return (
            <SafeAreaView style={{ flex: 1, marginBottom: -5 }}>
                <View style={{ backgroundColor: color, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <Image style={{ marginEnd: 5 }} source={icon}></Image>
                    <Text style={{ color: textColor, fontWeight: 'bold' }}>{text}</Text>
                </View>

                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <View>
                        <View style={styles.item}>
                            <Text style={[styles.text, styles.sectionText]}>Tanggal</Text>
                            <Text style={[styles.text, styles.textSmall, styles.bold, styles.black]}>{moment(SalesOrderDate).locale('id').format('DD MMMM YYYY')}</Text>
                            <Text style={[styles.text, styles.textSmall, styles.black]}>{moment(SalesOrderDate).locale('id').format('HH:mm [WIB]')}</Text>
                        </View>
                        <View style={styles.item}>
                            <TouchableWithoutFeedback onPress={() => this.setState({ showPaymentDetailModal: true })}>
                                <View style={[{ flexDirection: 'row', alignItems: 'center' }]} >
                                    <Text style={[styles.text, styles.sectionText]}>Pembayaran</Text>
                                    <View style={{ backgroundColor: blue, borderRadius: 50, width: 15, height: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 5 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 1 }}>?</Text>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                            {
                                PaymentType.PartialPaymentCode ? (
                                    <Text style={[styles.text, styles.textSmall, styles.bold, styles.black]}>{PaymentType.PartialPaymentName}</Text>                                    
                                ) : null
                            }
                            <Text style={[styles.text, styles.textSmall, styles.bold, styles.black]}>{PaymentType.Name}</Text>
                            {
                                PaymentStatus == STATUS.FAILED.CODE || isTimeout ? (
                                    <Text style={[styles.text, {color: orange}]}>Batas waktu pembayaran habis</Text>
                                ) : null
                            }
                            {
                                PaymentStatus == STATUS.WAITING.CODE && !isTimeout ?
                                    (<Text style={[styles.text, styles.textSmall, { color: orange }]}>Batas Waktu : <TravelCountdown type={'text'} hours={Payment.ExpiredInHours} minutes={Payment.ExpiredInMinutes} seconds={Payment.ExpiredInSeconds} onTimeout={() => this.setState({ isTimeout: true })}/></Text>) : null
                            }
                        </View>

                        <View style={styles.item}>
                            <Text style={[styles.text, styles.sectionText]}>Ringkasan Pembayaran</Text>
                            <View>
                                <SpaceBetween>
                                    <Text style={[styles.text, styles.black]}>Subtotal Harga Tiket</Text>
                                    <Text style={[styles.text, styles.black]}>{Rupiah(SubTotalPrice)}</Text>
                                </SpaceBetween>
                                {
                                    SalesOrder[0].SalesOrderDetail[0].Discount > 0 ? (
                                        <SpaceBetween>
                                            <Text style={[styles.text, styles.black]}>Kupon</Text>
                                            <Text style={[styles.text, styles.black]}>{Rupiah(SalesOrder[0].SalesOrderDetail[0].Discount)}</Text>
                                        </SpaceBetween>
                                    ) : null
                                }
                                <SpaceBetween>
                                    <Text style={[styles.text, styles.black]}>Biaya Layanan</Text>
                                    <Text style={[styles.text, styles.black]}>{Rupiah(totalServiceFee)}</Text>
                                </SpaceBetween>
                                <SpaceBetween>
                                    <Text style={[styles.text, styles.black]}>Biaya Bagasi</Text>
                                    <Text style={[styles.text, styles.black]}>{Rupiah(BaggageFee)}</Text>
                                </SpaceBetween>
                                <SpaceBetween>
                                    <Text style={[styles.text, styles.black]}>Biaya Makanan</Text>
                                    <Text style={[styles.text, styles.black]}>{Rupiah(MealFee)}</Text>
                                </SpaceBetween>
                            </View>
                            <Dash style={[styles.item, styles.separator]} dashGap={9} dashLength={7} dashColor={'darkgrey'} dashThickness={1} />
                            <SpaceBetween>
                                <Text style={[styles.text, styles.bold, styles.black]}>Total Pembayaran</Text>
                                <Text style={[styles.text, styles.bold, { color: orange }]}>{Rupiah(BookingTotal)}</Text>
                            </SpaceBetween>
                            {
                                CouponMappingCode ? (
                                    <View style={styles.item}> 
                                        <Text style={[styles.text, styles.sectionText]}>Kupon</Text>
                                        <Text style={[styles.text, styles.black]}>{CouponMappingCode}</Text>
                                    </View>
                                ) : null
                            }
                        </View>
                        {SalesOrder.map(this.renderSO)}
                    </View>
                </ScrollView>
                <Modal
                    isVisible={this.state.showPaymentDetailModal}
                    onBackButtonPress={() => this.setState({ showPaymentDetailModal: false })}
                    onBackdropPress={() => this.setState({ showPaymentDetailModal: false })}
                    style={styles.popUp}>
                    <View style={[styles.popUpDetail]}>
                        <View style={styles.popUpHeader}>
                            <Text style={{ color: 'black', fontSize: 20, fontWeight: '700', }}>Detail Pembayaran</Text>
                        </View>
                        <View>
                            {
                                PaymentType.PartialPaymentName ? (
                                    <View style={styles.item}>
                                        <Text style={[styles.text, styles.textLarge, styles.bold, styles.black]}>{PaymentType.PartialPaymentName} ({Rupiah(Payment.TransactionPartialAmount)})</Text>
                                        <Text style={[styles.text, styles.textLarge, styles.black]}>Kode transaksi Saldo Klik: {Payment.TransactionPartialCode}</Text>
                                    </View>
                                ) : null
                            }
                            <View style={styles.item}>
                                <SpaceBetween>
                                    <View>
                                        <Text style={[styles.text, styles.textLarge, styles.bold, styles.black]}>{PaymentType.Name} ({Rupiah(Payment.TransactionOtherAmount)})</Text>
                                        <Text style={[styles.text, styles.textLarge, styles.black]}>Kode {PaymentStatus != STATUS.SUCCESS.CODE ? 'Bayar' : 'Transaksi'}: #{Payment.TransactionCode}</Text>
                                    </View>
                                    {
                                        IsButtonCopyShow ? (
                                            <TouchableOpacity onPress={() => { Clipboard.setString(Payment.TransactionCode); notif('Kode berhasil disalin') }}>
                                                <Image width={50} height={50} source={require('../../assets/travel/Copy.png')}></Image>
                                            </TouchableOpacity>
                                        ) : null
                                    }
                                </SpaceBetween>
                                {/* {
                                    PaymentStatus == STATUS.WAITING.CODE ?
                                        (<Text style={[styles.text, styles.textLarge, { color: orange }]}>Batas Waktu : <TravelCountdown type={'text'} hours={Payment.ExpiredInHours} minutes={Payment.ExpiredInMinutes} seconds={Payment.ExpiredInSeconds} /></Text>) : null
                                } */}
                            </View>
                        </View>
                        <Button
                            text={'Tutup'}
                            style={{ borderColor: blue, borderWidth: 1 }}
                            onPress={() => this.setState({ showPaymentDetailModal: false })}
                            backgroundColor={'white'}
                            color={blue} />
                    </View>
                </Modal>
            </SafeAreaView >
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 0
    },
    separator: {
        height: .5
    },
    item: {
        marginVertical: 10
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    text: {
        margin: 2,
    },
    textLarge: {
        fontSize: 14
    },
    bold: {
        fontWeight: "bold"
    },
    textSmall: {
        fontSize: 12,
        flexWrap: "wrap"
    },
    grey: {
        color: 'grey'
    },
    black: {
        color: 'black'
    },
    sectionText: {
        fontSize: 10,
        color: 'darkgrey'
    },
    card: {
        shadowColor: "#000000",
        shadowOffset: { width: 0.1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 10,
        backgroundColor: "white",
        minHeight: height / 12,
        borderRadius: 10,
        margin: 5
    },
    cardContentContainer: {
        padding: 15
    },
    cardSection: {
        flex: 1,
        alignSelf: 'stretch',
        borderBottomColor: 'lightgrey',
        borderBottomWidth: 1,
        padding: 5
    },
    passengercard: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'lightgrey',
        backgroundColor: softgrey,
        padding: 10
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
        flex: 4,
        alignSelf: 'flex-start'
    },
    alignRight: {
        flex: 6,
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
		borderTopRightRadius: 10,
        padding: 20,
        paddingBottom: isIphoneXorAbove() ? 30 : 10,
	},
	popUpHeader: {
		flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10
    },
});