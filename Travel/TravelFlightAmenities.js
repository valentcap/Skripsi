import React, { Component } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Navigation } from 'react-native-navigation';
import SpaceBetween from '../../components/SpaceBetween';
import Button from '../../components/Travel/Button';
import { popScreen } from '../../libs/navigation';
import Rupiah from '../../libs/Rupiah';
import { layoutStyles, marginStyles, SCREEN_HEIGHT, SCREEN_WIDTH, textStyles, TRAVEL_BLUE, TRAVEL_SOFT_GREY } from '../../libs/Travel/TravelConstants';
import { isEmpty } from 'lodash';
import AutoHeightImage from 'react-native-auto-height-image';

export default class extends Component {
	static options(passProps) {
		return {
			topBar: {
				title: {
					text: passProps.Title
                },
                background: {
					color: '#E3E3E3'
				},
			}
		}
    }
    
	constructor(props){
		super(props);
		this.state = {
            Tickets: [],
            additionalPrice: 0,
            isReturnTrip: false,
            noAmenitiesPassenger: 0,
		}
		Navigation.events().bindComponent(this)
    }

    componentDidMount() {
        let { PassengerDetail, DepartureTicket, ReturnTicket, Title, SSR, ssrType } = this.props
        // PassengerDetail = PassengerDetail.filter(e => e.Type == 'adt' || e.Type == 'chd')
        let Tickets = ReturnTicket ? [DepartureTicket, ReturnTicket] : [DepartureTicket]
        let additionalPrice = 0
        let { noAmenitiesPassenger } = this.state

        PassengerDetail.forEach(e => {
            if(e.Type == 'inf') noAmenitiesPassenger+=1
            if(isEmpty(e.SSR)) { // if any ssr included
                e.SSR = {
                    'baggage': [],
                    'meal': []
                }
            }
            else {
                e.SSR[ssrType].forEach(e => {
                    additionalPrice += e.Amount
                })
            }
        });
        this.setState({ PassengerDetail, Tickets, additionalPrice, noAmenitiesPassenger })
    }

    selectSSR(SSRDetail, passengerIndex, key, index) {
        let { ssrType, ReturnTicket } = this.props
        let { PassengerDetail, additionalPrice, isReturnTrip } = this.state
        let prevSSRIndex = PassengerDetail[passengerIndex].SSR[ssrType].findIndex(e => e.Key == key)
        let prevObj = null
        let AppFltKeys = 0
        if(ReturnTicket){
            //pergi
            if(index==0){
                AppFltKeys = 0
            }
            //pulang
            else if(index==1){
                AppFltKeys = 1
            }else{
                AppFltKeys = index
            }
        }

        if(prevSSRIndex > -1) {
            prevObj = PassengerDetail[passengerIndex].SSR[ssrType][prevSSRIndex]
            // PassengerDetail[passengerIndex].SSR[ssrType].splice(prevSSRIndex, 1)
        }
        let newSSR = {}
        if(ssrType == 'baggage'){
            newSSR = {
                Key: key,
                SsrType: ssrType,
                Code: SSRDetail.code,
                Unit: SSRDetail.unit,
                Amount: SSRDetail.amount,
                AppFltKeys: AppFltKeys
            }
        }
        else if(ssrType == 'meal') {
            newSSR = {
                Key: key,
                SsrType: ssrType,
                Code: SSRDetail.code,
                Amount: SSRDetail.amount,
                AppFltKeys: AppFltKeys
            }
        }
        // PassengerDetail[passengerIndex].SSR[ssrType].push(newSSR)
        // console.log(PassengerDetail[passengerIndex].SSR[ssrType][0])
        if(prevSSRIndex == -1) PassengerDetail[passengerIndex].SSR[ssrType].push(newSSR)
        else PassengerDetail[passengerIndex].SSR[ssrType][prevSSRIndex] = newSSR

        if(prevObj != null){
            if(prevObj.Amount < SSRDetail.amount) additionalPrice += (SSRDetail.amount - prevObj.Amount)
            else additionalPrice -= (prevObj.Amount - SSRDetail.amount)
        }
        else additionalPrice += SSRDetail.amount
        this.setState({ PassengerDetail, additionalPrice })
    }

    confirmAmenities() {
        let { PassengerDetail } = this.props
        this.props.onSelect(PassengerDetail)
        popScreen(this.props.componentId)
    }

    checkSelected(SSRDetail, Passenger, key) {
        let exist = Passenger.SSR[this.props.ssrType].findIndex(e => e.Code == SSRDetail.code && e.Key == key) > -1 ? true : false
        return exist
    }

    goToTop = () => {
        this.scroll.scrollTo({x: 0, y: 0, animated: true});
     }

	render() {
        let { SSR, ssrType } = this.props
        let { PassengerDetail, additionalPrice, Tickets, isReturnTrip, noAmenitiesPassenger } = this.state
        let onSwitch = (isReturnTrip) => {
            this.setState({isReturnTrip})
        }
		return (
			<SafeAreaView style={[layoutStyles.safearea, { backgroundColor: TRAVEL_SOFT_GREY }]}>
                {
                    ssrType == 'meal' ? (
                        <SpaceBetween style={{ backgroundColor: 'white' }}>
                            <TouchableOpacity
                                style={[
                                    styles.navigationTab,
                                    isReturnTrip ? null : styles.navigationtabActive
                                ]}
                                onPress={() => onSwitch(false)}>
                                <Text style={[isReturnTrip ? textStyles.black : [styles.navigationtabActive, { borderBottomWidth: 0 }], textStyles.bold]}>
                                    Pergi
                                </Text>
                            </TouchableOpacity>
                            {
                                Tickets.length > 1 ? (
                                    <TouchableOpacity
                                        style={[
                                            styles.navigationTab,
                                            isReturnTrip ? styles.navigationtabActive : null
                                        ]}
                                        onPress={() => onSwitch(true)}>
                                        <Text style={[isReturnTrip ? [styles.navigationtabActive, { borderBottomWidth: 0 }] : textStyles.black, textStyles.bold]}>
                                            Pulang
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ flex: 1 }}/>
                                )
                            }
                        </SpaceBetween>
                    ) : null
                }
                <ScrollView ref={(c) => {this.scroll = c}} style={layoutStyles.safearea} showsVerticalScrollIndicator={false} bounces={false}>
                    {
                        PassengerDetail && SSR[ssrType].map((e, i) => {
                            //find same SSR key with flight key
                            let { flight, data, key, isReturn } = e
                            if((ssrType == 'meal' && (isReturn == isReturnTrip)) || ssrType != 'meal')  
                            return (
                                <View key={i}>
                                    <View style={styles.section}>
                                        <Text style={textStyles.bold}>{flight.origin}</Text>
                                        <Image source={require('../../assets/travel/Single-trip.png')} style={marginStyles.itemHorizontal} />
                                        <Text style={textStyles.bold}>{flight.destination}</Text>
                                    </View>
                                    {
                                        PassengerDetail.map((Passenger, j) => { 
                                            if(Passenger.Type == 'inf') return null
                                            return (
                                                <View key={j} style={styles.passengerSection}>
                                                    <Text style={[textStyles.large, textStyles.grey, marginStyles.bottomMedium]}>{j+1}. {Passenger.Title}</Text>
                                                    <ScrollView key={j} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} horizontal={ssrType == 'baggage'}>
                                                        {
                                                            this.props.Title == 'Bagasi' ? (
                                                                data.map((SSRDetail, l) => {
                                                                    let selected = this.checkSelected(SSRDetail, Passenger, key)
                                                                    return (
                                                                        <TouchableOpacity key={l} style={[styles.baggageSelector, selected ? styles.baggageSelectorSelected : null]} onPress={() => this.selectSSR(SSRDetail, j, key, i)}>
                                                                            <Text style={[textStyles.xLarge, marginStyles.bottomSmall, { color: selected ? TRAVEL_BLUE : "#CCCCCC" }]}>{SSRDetail.qty} {SSRDetail.unit}</Text>
                                                                            <Text style={{ color: selected ? TRAVEL_BLUE : "#CCCCCC" }}>{SSRDetail.amount==0 ? "Gratis" : Rupiah(SSRDetail.amount)}</Text>
                                                                        </TouchableOpacity>
                                                                    )
                                                                })
                                                            ) : (
                                                                data.map((SSRDetail, l) => {
                                                                    let selected = this.checkSelected(SSRDetail, Passenger, key)
                                                                    return (
                                                                        <TouchableOpacity key={l} style={styles.mealSelector} 
                                                                            onPress={() => 
                                                                            {
                                                                                this.selectSSR(SSRDetail, j, key, i)
                                                                                if(j == PassengerDetail.length-1-noAmenitiesPassenger && i == SSR[ssrType].length/2 - 1){
                                                                                    onSwitch(true)
                                                                                    this.goToTop()
                                                                                }
                                                                            }
                                                                        }>
                                                                            <SpaceBetween>
                                                                                <View style={layoutStyles.rowCenterVertical}>
                                                                                    <View style={[styles.radio, { marginRight: 7 }]}>
                                                                                        {
                                                                                            selected ? <View style={styles.radioActive}/> : null
                                                                                        }
                                                                                    </View>
                                                                                    <Text style={{color: selected ? TRAVEL_BLUE : "grey"}}>{SSRDetail.desc}</Text>
                                                                                </View>
                                                                                <Text>{Rupiah(SSRDetail.amount)}</Text>
                                                                            </SpaceBetween>
                                                                        </TouchableOpacity>
                                                                    )
                                                                })
                                                            )
                                                        }
                                                    </ScrollView>
                                                </View>
                                            )
                                        })
                                    }
                                    <View>
                                    </View>
                                </View>
                            )
                            return null
                        })
                    }
                </ScrollView>
                <SpaceBetween style={[marginStyles.itemLarge, marginStyles.paddingSmall, marginStyles.paddingHorizontalxLarge, { backgroundColor: 'white' }]}>
                    <Text style={[textStyles.bold, textStyles.orange, textStyles.xLarge]}>{Rupiah(additionalPrice)}</Text>
                    <Button
                        style={{ backgroundColor: TRAVEL_BLUE, paddingHorizontal: 20 }}
                        text="Pilih"
                        bold
                        onPress={() => this.confirmAmenities()}>
                    </Button>
                </SpaceBetween> 
			</SafeAreaView>
		)
	}
}

const styles = StyleSheet.create({
    section: {
        ...marginStyles.paddingLarge,
        ...marginStyles.paddingHorizontalxLarge,
        ...layoutStyles.rowCenterVertical,
        // alignItems: 'flex-start',
        backgroundColor: TRAVEL_SOFT_GREY
    },
    passengerSection: {
        backgroundColor: 'white',
        padding: 15
    },
    baggageSelector: {
        justifyContent: 'center',
		alignItems: 'center',
        width: SCREEN_WIDTH - (SCREEN_WIDTH*.7),
		height: SCREEN_HEIGHT / 10,
        borderWidth: 2,
        borderColor: TRAVEL_SOFT_GREY,
		borderRadius: 5,
		marginHorizontal: 5
    },
    baggageSelectorSelected: {
        borderColor: TRAVEL_BLUE
    },
    mealSelector: {
        padding: 10
    },
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
    radioActive: {
        height: 8,
        width: 8,
        borderRadius: 24,
        backgroundColor: TRAVEL_BLUE
    },
    radio: {
        height: 10,
        width: 10,
        borderRadius: 30,
        padding: 8,
        borderColor: 'lightgrey',
        borderWidth: 2,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center'
    }
});