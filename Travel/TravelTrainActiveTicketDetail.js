import moment from 'moment';
import React, { Component } from 'react';
import { Alert, Dimensions, Image, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AutoHeightImage from 'react-native-auto-height-image';
import FloatLabelTextInput from 'react-native-floating-label-text-input';
import RNFS from 'react-native-fs';
import Modal from "react-native-modal";
import { Navigation } from 'react-native-navigation';
import OpenSettings from 'react-native-open-settings';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Button from '../../components/Button';
import SpaceBetween from '../../components/SpaceBetween';
import { travelAPI } from '../../libs/api';
import { blue, grey, softgrey } from '../../libs/Constants';
import { isIphoneXorAbove, pushScreen } from '../../libs/navigation';
import notif from '../../libs/notif';
import { marginStyles, TRAVEL_API_URL } from '../../libs/Travel/TravelConstants';

let { width, height } = Dimensions.get('window')

export default class extends Component {
    static options(passProps) {
        return {
            topBar: {
                background: {
                    color: 'white'
                },
                title: {
                    component: {
                        name: 'TravelActiveTicketDetailTitle',
                        alignment: 'fill',
                        passProps: {
                            type: 'Kereta',
                            origin: passProps.OriginCity,
                            destination: passProps.DestinationCity,
                            journey: passProps.JourneyType,
                            SONumber: passProps.SalesOrder[0].SalesOrderNo
                        }
                    }
                },
                rightButtons: [
                    {
                        id: 'btnDownload',
                        icon: require('../../assets/travel/Download.png')
                    }
                ],
                noBorder: false,
                elevation: 1.5
            }
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            activeTab: 0,
            SelectedTicket: null,
            selectedTicketIndex: 0,
            activeTextInput: 0,
            email: null,
            showError: false,
            btnDownloadText: 'Unduh',
            isDownloading: false,
            progress: 0,
            downloadId: null,

            showBarcodeModal: false
        }
        Navigation.events().bindComponent(this)
    }

    navigationButtonPressed({ buttonId }) {
        if(buttonId == 'btnDownload') this.setState({ showDownloadModal: true })
        else if (buttonId == 'btnBack') this.handleBack()
    }
    
    handleBack = () => {
        let { isDownloading, downloadId } = this.state
        let { isFromThankYou, onBack } = this.props
        if(isDownloading){
            RNFS.stopDownload(downloadId).then(() => {
                if(isFromThankYou){
                    onBack && onBack()
                }
                else {
                    popScreen(this.props.componentId)
                }
            })
        }
    }

    handleETicket = (download=false) => {
        let { SalesOrder } = this.props
        let { email } = this.state
        if(download){
            if(Platform.OS === 'android') {
		        request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE).then(result => {
                    if (result == RESULTS.DENIED) {
                        Platform.OS === 'ios' ?
                            Alert.alert('KlikIndomaret', 'Fitur unduh tidak bisa dijalankan. Apabila Anda ingin menggunakan fitur unduh, mohon mengaktifkan izin mengakses penyimpanan dengan menekan tombol pengaturan dibawah', [{
                                text: 'Batal'
                            }, {
                                text: 'Pengaturan',
                                onPress: () => {
                                    Linking.openURL('app-settings:')
                                }
                            }]) :
                            Alert.alert('KlikIndomaret', 'Fitur unduh tidak bisa dijalankan. Apabila Anda ingin menggunakan fitur unduh, mohon mengaktifkan izin mengakses penyimpanan dengan menekan tombol OK dibawah', [{
                                text: 'Batal'
                            }, {
                                text: 'OK',
                                onPress: () => {
                                    this.checkPermission()
                                }
                            }])
                    } else if (result == RESULTS.BLOCKED) {
                        Platform.OS === 'ios' ?
                            Alert.alert('KlikIndomaret', 'Fitur unduh tidak bisa dijalankan karena keterbatasan fitur pada perangkat Anda.', [{
                                text: 'OK'
                            }]) :
                            Alert.alert('KlikIndomaret', 'Fitur unduh tidak bisa dijalankan. Apabila Anda ingin menggunakan fitur unduh, mohon mengaktifkan izin mengakses penyimpnaan dengan menekan tombol Pengaturan dibawah', [{
                                text: 'Batal'
                            }, {
                                text: 'Pengaturan',
                                onPress: () => {
                                    OpenSettings.openSettings();
                                }
                            }])
                    } else if (result == RESULTS.GRANTED) {
                        this.setState({ btnDownloadText: 'Mulai mengunduh...'})
                        SalesOrder.forEach((SO) => {
                            RNFS.downloadFile({
                                fromUrl: SO.EticketUrl,
                                toFile: `${Platform.OS == 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalStorageDirectoryPath + '/Download'}/KlikIndomaretTravel_${SO.SalesOrderNo}.pdf`,
                                begin: (response) => {
                                    this.setState({ isDownloading: true, btnDownloadText: `Mengunduh`, downloadId: response.jobId })
                                },
                                progress: (res) => {
                                    let progressPercent = (res.bytesWritten / res.contentLength)*100; // to calculate in percentage
                                    this.setState({ progress: Math.round(progressPercent).toString() });
                                },
                                
                            }).promise.finally((r) => {

                            });
                        })
                        this.setState({ isDownloading: false, btnDownloadText: 'Unduh' })
                    }
                })
            }
            else {
                this.setState({ btnDownloadText: 'Mulai mengunduh...'})
                SalesOrder.forEach((SO) => {
                    RNFS.downloadFile({
                        fromUrl: SO.EticketUrl,
                        toFile: `${Platform.OS == 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalStorageDirectoryPath + '/Download'}/KlikIndomaretTravel_${SO.SalesOrderNo}.pdf`,
                        begin: (response) => {
                            this.setState({ isDownloading: true, btnDownloadText: `Mengunduh`, downloadId: response.jobId })
                        },
                        progress: (res) => {
                            let progressPercent = (res.bytesWritten / res.contentLength)*100; // to calculate in percentage
                            this.setState({ progress: Math.round(progressPercent).toString() });
                        },
                        
                    }).promise.finally((r) => {
                        
                    });
                })
                this.setState({ isDownloading: false, btnDownloadText: 'Unduh' })
            }
        }
        else{
            let regex = new RegExp(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i, 'gi')
            if(!regex.test(email)){
                this.setState({ showError: true })
            }else{
                this.setState({ showError: false })
                SalesOrder.forEach((SO) => {
                    let body = {
                        "ClientID": "TravelKlik",
                        "TravelType": "Kereta",
                        "TrxType": "SEND ISSUED EMAIL",
                        "Detail": {
                            "SalesOrderHeaderId": SO.SalesOrderHeaderId,
                            "Email": email
                        }
                    }
                    let url = `${TRAVEL_API_URL}/Transactions/post/`
                    travelAPI(url, 'POST', body, (response) => {
                        if(response){
                            if(response.RespCode == '00'){
                                notif('E-ticket berhasil dikirim ke ' + email)
                            }
                            else{
                                notif('E-ticket gagal dikirim')
                            }
                        }
                    })
                })
            }
        }
    }

    renderTripDetail = (SO, i) => {
        let { Booking, SalesOrderNo } = SO
        let { originStation, destinationStation, DepartureDate, ArrivalDate, TrainName } = Booking[0]
        return (
            <View style={[styles.container, styles.row, styles.item]}>
                <AutoHeightImage width={50} source={require('../../assets/travel/Logo/KAI.png')} style={{ alignSelf: 'flex-start' }}></AutoHeightImage>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.textSmall, styles.bold, styles.black]}>{i == 0 ? 'Pergi' : 'Pulang'} <Text style={styles.grey}>(Pesanan #{SalesOrderNo})</Text></Text>
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
                        <Text style={[styles.textSmall, styles.alignLeft, styles.grey]}>Kereta</Text>
                        <Text style={[styles.alignRight, styles.bold, styles.textLarge, styles.black]}>{TrainName}</Text>
                    </View>
                </View>
            </View>
        )
    }

    renderBookingCard = (SO, i) => {
        return (
            <TouchableOpacity onPress={ () => this.setState({ showBarcodeModal: true, SelectedTicket: SO, selectedTicketIndex: i })}>
                <SpaceBetween style={styles.card}>
                    <View>
                        <Text style={[styles.textLarge, styles.bold, styles.black, { color: 'darkgrey' }]}>Tiket {i == 0 ? 'Pergi' : 'Pulang'}</Text>
                        <Text style={[styles.textLarge, styles.black, { marginTop: 10}]}>Kode Booking: <Text style={[styles.bold, styles.black, { fontSize: 18 }]}>{SO.Booking[0].BookingNumber}</Text></Text>
                    </View>
                    <View>
                        <Image style={{ height: 50, width: 50}} source={{ uri: SO.URLBarcode }} defaultSource={require('../../assets/travel/Barcode.png')}/>
                    </View>
                </SpaceBetween>
            </TouchableOpacity>
        )
    }

    render() {
        let { activeTab, SelectedTicket, selectedTicketIndex, email, showError, btnDownloadText, isDownloading, progress } = this.state
        let { JourneyType, SalesOrder } = this.props
        let { Booking } = SalesOrder[0]
        Booking = Booking[0]
        let onSwitch = (index) => {
			this.setState({ activeTab: index })
        };
        
        let openKAIWeb = () => {
            pushScreen(this.props.componentId, 'WebView', {
                uri: 'http://kai.id',
                title: 'Kereta Api Indonesia'
            })
        }

        return (
            <SafeAreaView style={{ flex: 1 }}>
                {Platform.OS === 'ios' ? (<View style={[marginStyles.bottomMedium, { backgroundColor: 'lightgrey', height: 1 }]}></View>) : null}
                <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: 'white' }}>
                    {SalesOrder.map(this.renderTripDetail)}

                    <View style={styles.item}>
                        <SpaceBetween>
                            <TouchableOpacity
                                style={[styles.navigationTab, activeTab ? null : [styles.navigationtabActive] ]}
                                onPress={() => onSwitch(0)}>
                                <Text style={activeTab ? styles.black : [styles.navigationtabActive, styles.black, { borderBottomWidth: 0 }]}>Kode Pemesanan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.navigationTab, activeTab ? styles.navigationtabActive : null ]}
                                onPress={() => onSwitch(1)}>
                                <Text style={activeTab ? [styles.navigationtabActive, styles.black, { borderBottomWidth: 0 }] : styles.black}>Daftar Penumpang</Text>
                            </TouchableOpacity>
                        </SpaceBetween>
                    </View>
                    {
                        activeTab ? (
                            <View style={[styles.passengercard, styles.item, styles.container]}>
                                <Text style={[styles.text, styles.textSmall, { color: grey, marginBottom: 10 }]}>Rincian Penumpang</Text>
                                {
                                    Booking.Passenger.map((Passenger, j) => {
                                        let { Sallutation, Name, wagonName, wagonNumber, SeatRow, SeatPotition, Identity, Maturity } = Passenger
                                        if(Sallutation == 0) Sallutation = 'Tn.'
                                        else if(Sallutation == 1) Sallutation = 'Ny.'
                                        else Sallutation = 'Nn.'
                                        return (
                                            <View>
                                                <View style={[styles.row, (j != 0 && j != Booking.Passenger.length - 1 ? styles.item : null)]}>
                                                    <Text style={[styles.bold, styles.textLarge, styles.passengerAlignLeft]}>{j+1}.</Text>
                                                    <View style={styles.passengerAlignRight}>
                                                        <Text style={[styles.bold, styles.textLarge, styles.black, { flexWrap: 'wrap' }]} numberOfLines={1}>{Sallutation} {Name} ({Maturity == 0 ? 'Dewasa' : 'Bayi'})</Text>
                                                        <View style={styles.row}>
                                                            <Text style={[styles.alignLeft, styles.textSmall, styles.black]}>No. Identitas</Text>
                                                            <Text style={[styles.alignRight, styles.textSmall, styles.black]} numberOfLines={1}>: {Identity}</Text>
                                                        </View>
                                                        <View style={styles.row}>
                                                            <Text style={[styles.alignLeft, styles.textSmall, styles.black]}>Tempat duduk</Text>
                                                            <Text style={[styles.alignRight, styles.textSmall, styles.black]}>: {wagonName} {wagonNumber} / Kursi {SeatRow}{SeatPotition}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    })
                                }
                            </View>
                        ) : (
                            <View style={styles.item}>
                            {
                                JourneyType == 'SingleTrip' ? (
                                    <View style={[{ alignItems: 'center', marginVertical: 5 }]}>
                                        <Text style={[styles.textLarge, styles.black]}>Kode Booking: <Text style={[styles.bold, { fontSize: 18 }]}>{SalesOrder[0].Booking[0].BookingNumber}</Text></Text>
                                        <Image style={{ height: 250, width: 250 }} source={{ uri: SalesOrder[0].URLBarcode }} defaultSource={require('../../assets/travel/Barcode.png')}/>
                                    </View>
                                ) : (
                                    SalesOrder.map(this.renderBookingCard)
                                )
                            }
                                <View style={[styles.container, styles.item, { borderRadius: 10, borderColor: 'lightgrey', borderWidth: 1, padding: 15, paddingHorizontal: 20 }]}>
                                    <Text style={[styles.textSmall, styles.bold, styles.black, { marginBottom: 10 }]}>Informasi Penting</Text>
                                    
                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify', fontWeight: "bold"}]}>Ketentuan update perjalanan KA di Pulau Jawa untuk keberangkatan tanggal 22 Des 2020 s.d 08 Jan 2021:</Text>
                                    </View>

                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>{" "}</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>1. Penumpang wajib menunjukkan surat keterangan Rapid Test Antigen dengan hasil NEGATIF paling lambat 3 x 24 jam atau H-3 sebelum keberangkatan (tidak diwajibkan bagi penumpang anak-anak dibawah usia 12 tahun) </Text>
                                    </View>
                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>{" "}</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>2. Penumpang dalam kondisi sehat, tidak menderita flu, pilek, batuk, hilang daya penciuman, diare dan demam. </Text>
                                    </View>
                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>{" "}</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>3. Suhu badan tidak lebih dari 37,3 derajat celcius. </Text>
                                    </View>
                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>{" "}</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>4. Penumpang wajib menggunakan masker kain 3 ( tiga ) lapis atau masker medis menutupi hidung dan mulut serta menggunakan face shield. </Text>
                                    </View>

                                    <View style={styles.rowList}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify', fontWeight: "bold"}]}>Ketentuan update perjalanan KA di Pulau Sumatera: </Text>
                                    </View>

                                    <View style={{alignItems: "center",flexDirection: "row",marginBottom: 20}}>
                                        <Text style={[styles.leftMarker, styles.black, {fontWeight: 'bold'}]}>{" "}</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>1. Penumpang dapat menunjukkan hasil Rapid Test Antibodi atau PCR Swab Test dengan hasil NON REAKTIF/NEGATIF dengan masa berlaku paling lambat 14 hari sebelum jadwal keberangkatan kereta api. </Text>
                                    </View>
                                    
                                    <View style={styles.row}>
                                        <Text style={[styles.leftMarker, styles.black]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>E-tiket tidak dapat digunakan untuk check-in dan hanya berfungsi untuk mencetak tiket fisik di stasiun. Tiket fisik dapat dicetak mulai dari 7x24 jam sebelum waktu keberangkatan.</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={[styles.leftMarker, styles.black]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>Tunjukkan kartu identitas yang digunakan saat memesan tiket untuk check-in di stasiun.</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={[styles.leftMarker, styles.black]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>Pastikan untuk tiba di stasiun paling lambat 60 menit sebelum waktu keberangkatan.</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={[styles.leftMarker, styles.black]}>-</Text>
                                        <Text style={[styles.textSmall, styles.black, {textAlign: 'justify'}]}>Lihat informasi lebih lanjut di situs PT Kereta Api Indonesia (KAI) kai.id <Text style={{ color: blue }} onPress={() => openKAIWeb()}>di sini</Text> atau hubungi Contact Center PT KAI di 021-121.</Text>
                                    </View>
                                </View>
                                <Text style={[styles.section, styles.textSmall, styles.black, { textAlign: 'center' }]}>Untuk informasi lebih lanjut, hubungi call center kami di (021) 1500 280 (Senin - Jumat pukul 08.00-17.00) atau email ke customercare@klikindomaret.com</Text>
                            </View>
                        )
                    }
                </ScrollView>

                <Modal
                    isVisible={this.state.showBarcodeModal}
                    onBackButtonPress={() => this.setState({ showBarcodeModal: false })}
                    onBackdropPress={() => this.setState({ showBarcodeModal: false })}
                    style={styles.popUp}>
                    <View style={styles.popUpDetail}>
                        <View style={styles.popUpHeader}>
                            <TouchableOpacity onPress={() => this.setState({ showBarcodeModal: false })}>
                                <Image style={{ width: 15, height: 15, tintColor: 'black' }} source={require('../../assets/travel/Close.png')} />
                            </TouchableOpacity>
                            <View>
                                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700', marginLeft: 20 }}>Tiket {selectedTicketIndex == 0 ? 'Pergi' : 'Pulang'}</Text>
                            </View>
                        </View>
                        {
                            SelectedTicket ? (
                                <View style={{ alignItems: 'center'}}>
                                    <Text style={[styles.textLarge, { marginTop: 10}]}>Kode Booking: <Text style={[styles.bold, { fontSize: 18, color: blue }]}>{SelectedTicket.Booking[0].BookingNumber}</Text></Text>
                                    <Image style={[styles.modalImage, { height: 250, width: 250 }]} source={{ uri: SelectedTicket.URLBarcode }} defaultSource={require('../../assets/travel/Barcode.png')}/>
                                </View>
                            ) : null
                        }
                    </View>
                </Modal>

                <Modal
                    isVisible={this.state.showDownloadModal}
                    onBackButtonPress={() => this.setState({ showDownloadModal: false, showError: false, email: null })}
                    onBackdropPress={() => this.setState({ showDownloadModal: false, showError: false, email: null })}
                    style={styles.popUp}
                    avoidKeyboard={true}>
                    <View style={styles.popUpDetail}>
                        <View style={styles.popUpHeader}>
                            <TouchableOpacity onPress={() => this.setState({ showDownloadModal: false, showError: false, email: null })}>
                                <Image style={{ width: 15, height: 15, tintColor: 'black' }} source={require('../../assets/travel/Close.png')} />
                            </TouchableOpacity>
                            <View>
                                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700', marginLeft: 20 }}>E-Tiket</Text>
                            </View>
                        </View>
                        <View style={{ marginHorizontal: 20 }}>
                            <View style={styles.row}>
                                <View style={{ flex: 1, paddingRight: 20 }}>
                                    <FloatLabelTextInput
                                        onFocus={() => {
                                            this.setState({ activeTextInput: 0 })
                                        }}
                                        value={email}
                                        onChangeTextValue={(value) => this.setState({ email: value })}
                                        autoCorrect={false}
                                        autoCapitalize = 'none'
                                        placeholder="Alamat Email" 
                                        place
                                        maxLength={50}/>
                                    {showError ? <Text style={styles.errorText}>Email tidak sesuai dengan format</Text> : null}
                                </View>
                                <Button text={'Kirim'} color={blue} onPress={() => this.handleETicket()}/>
                            </View>
                            <View style={[styles.row, styles.item]}>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: 'lightgrey', height: 1, width: '30%' }} />
                                <Text style={[styles.textSmall, styles.grey, { marginHorizontal: 10 }]}>Atau</Text>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: 'lightgrey', height: 1, width: '30%' }} />
                            </View>
                            <Button
                                text={btnDownloadText.concat(isDownloading ? ` (${progress}%)` : '')}
                                style={{ borderColor: isDownloading ? grey : blue, borderWidth: 1, backgroundColor: isDownloading ? grey : 'white'}}
                                onPress={isDownloading ? null : () => this.handleETicket(true)}
                                backgroundColor='white'
                                transparent={true}
                                color={isDownloading? 'white' : blue} />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView >
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 20
    },
    section: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 30
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
    rowList: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5
    },
    grey: {
        color: 'grey'
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
    black: {
        color: 'black'
    },
    textSmall: {
        fontSize: 12,
        flexWrap: "wrap"
    },
    errorText: {
        fontSize: 10,
        marginVertical: 2,
        color: 'red'
    },
    sectionText: {
        fontSize: 10,
        color: 'darkgrey'
    },
    popUp: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    popUpDetail: {
        backgroundColor: 'white',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingBottom: isIphoneXorAbove() ? 30 : 10,
    },
    popUpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20
    },
    card: {
		shadowColor: "#000000",
		shadowOffset: { width: 0.1, height: 1 },
		shadowOpacity: 0.3,
		shadowRadius: 2,
		elevation: 5,
        marginBottom: 20,
        marginHorizontal: 20,
		backgroundColor: "white",
		minHeight: height / 12,
        borderRadius: 10,
        padding: 15,
        paddingHorizontal: 20
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
    navigationTab: {
		flex: 1,
		padding: 15,
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center"
	},
	navigationtabActive: {
		borderBottomWidth: 2,
		borderBottomColor: blue,
		color: blue
    },
    modalImage: {
        alignSelf: 'center',
        margin: 20
    },
    leftMarker: {
        alignSelf: 'flex-start',
        marginRight: 5
    }
});