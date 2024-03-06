import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as moment from 'moment';
import { DataSource } from 'typeorm';

@Injectable()
export class ZentrumhubService {

  constructor(private readonly connection: DataSource) {}

  private getThepriceDroppingValue = async () => {
    try {
      const query = 'SELECT * FROM checkins_hotels_policy WHERE id = ?';
      const [rows] = await this.connection.query(query, [2]);
      // const [rows] = await this.connection.query('SELECT * FROM checkins_hotels_policy WHERE id = ?', [1]);
      console.log(rows);
      if (rows) {
        return rows.totalRate;
      } else {
        throw new Error('Dropping value not found for id = 2');
      }
    } catch (error) {
      console.error('Error retrieving dropping value:', error.message);
      throw new Error('Failed to retrieve dropping value');
    }
  };

  private getThepriceReaddedValue = async () => {
    try {
      const query = 'SELECT * FROM checkins_hotels_policy WHERE id = ?';
      const [rows] = await this.connection.query(query, [2]);
      // const [rows] = await this.connection.query('SELECT * FROM checkins_hotels_policy WHERE id = ?', [1]);
      console.log(rows);
      if (rows) {
        return rows.checkoutRate;
      } else {
        throw new Error('Dropping value not found for id = 2');
      }
    } catch (error) {
      console.error('Error retrieving dropping value:', error.message);
      throw new Error('Failed to retrieve dropping value');
    }
  };

  private getThepriceIncreaseValue = async () => {
    try {
      const query = 'SELECT * FROM checkins_hotels_policy WHERE id = ?';
      const [rows] = await this.connection.query(query, [2]);
      // const [rows] = await this.connection.query('SELECT * FROM checkins_hotels_policy WHERE id = ?', [1]);
      console.log(rows);
      if (rows) {
        return rows.publishedRate;
      } else {
        throw new Error('Dropping value not found for id = 2');
      }
    } catch (error) {
      console.error('Error retrieving dropping value:', error.message);
      throw new Error('Failed to retrieve dropping value');
    }
  };

  private formatDate = (date: string) => {
    const momentDate = moment(date).utcOffset(0, true);
    return momentDate.format('YYYY-MM-DD');
  };

  private calculateTotalRoomNights = (startDate: string, endDate: string, rooms: number) => {
    const momentDate = moment(startDate).utcOffset(0, true);
    const momentDate2 = moment(endDate).utcOffset(0, true);
    const diffInDay = momentDate2.diff(momentDate, 'days');
    return diffInDay * rooms;
  };

  private generateHeaders = (ipAddress: string, correlationId: string) => {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Encoding': 'gzip,deflate,compress',
      apiKey: process.env.ZENTRUMHUB_API_KEY,
      accountId: process.env.ZENTRUMHUB_ACCOUNT_ID,
      'customer-ip': ipAddress,
      correlationId: correlationId,
    };
  };

  private async getAllHotels(token: string, headers: any , diffInDays : number, totalRoomNights : number , rooms : number , resultkey : string , noOfCallingTimes: number = 0 ) {
    // Implement your logic to get hotel data from the Zentrumhub API
    // Example:
    try {
      const response = await axios.get(`${process.env.ZENTRUMHUB_API_URL}/availability/async/${token}/results${resultkey ? `?nextResultsKey=${resultkey}` : ""}`, { headers });
      const data = response.data;
      const priceDroppingValue = await this.getThepriceDroppingValue();
      const priceReAddedValue = await this.getThepriceReaddedValue();
      const priceIncreaseValue = await this.getThepriceIncreaseValue();

      if (data.status === "InProgress") {
        if (data.hotels.length === 0) {
          //calling the same api again if the response is empty with the 500 miliseconds delay
          return new Promise(async (resolve) => {
            setTimeout(async () => {
              const newData = await this.getAllHotels(token, headers, diffInDays, totalRoomNights, rooms, resultkey);
              resolve(newData);
            }, 500);
          });
        } else {
          data.noofrooms = rooms;
          data.noofdays = diffInDays;
          data.totalRoomNights = totalRoomNights;
          const modifiedData = {
            ...data,
            hotels: data.hotels.map((hotel  :any ) => {
              let pricePerRoomPerNight :any;
              let pricePerRoomPerNightPublish :any;
              let pricefortotalrooms :any;
          
              if (hotel.rate.providerName === "RateHawk") {
                pricePerRoomPerNight =
                  (hotel.rate.totalRate / totalRoomNights) * priceDroppingValue;
                pricePerRoomPerNightPublish = hotel.rate.baseRate / totalRoomNights;
                const totalRateCeil = Math.ceil(hotel.rate.totalRate);
                pricefortotalrooms = totalRateCeil * priceDroppingValue;
              } else {
                pricePerRoomPerNight =
                  (hotel.rate.totalRate / diffInDays) * priceDroppingValue;
                pricePerRoomPerNightPublish = hotel.rate.baseRate / diffInDays;
                const totalRateCeil = Math.ceil(hotel.rate.totalRate);
                pricefortotalrooms =
                  totalRateCeil * rooms * priceDroppingValue;
              }
          
              // Calculate the new total rate with the priceDroppingValue factor
              const newTotalRate = hotel.rate.totalRate * priceDroppingValue;
              const newBaseRate = hotel.rate.baseRate * priceIncreaseValue;
          
              // Calculate the fee as the difference between the original total rate and the new total rate
              const feeAmount =
                hotel.rate.totalRate * priceReAddedValue;
          
              // Create the new rate component object with type "Fee"
              const feeComponent = {
                amount: feeAmount,
                description: "Agency Fee",
                type: "Fee",
              };
          
              // Add the fee component to the rate's otherRateComponents array
              const updatedRate = {
                totalRate: Math.ceil(newTotalRate),
                baseRate: Math.ceil(newBaseRate),
                providerName: hotel.rate.providerName,
                otherRateComponents: [feeComponent],
                cancellationPolicy: hotel.rate.cancellationPolicy,
                dailyTotalRate: Math.ceil(pricePerRoomPerNight),
                dailyPublishedRate: Math.ceil(pricePerRoomPerNightPublish * priceIncreaseValue),
                totalTripRate: Math.ceil(pricefortotalrooms),
              };
          
              return {
                id: hotel.id,
                relevanceScore: hotel.relevanceScore,
                rate: updatedRate,
                options: hotel.options,
              };
            }),
          };
          
          return modifiedData;
          // res.status(200).json(modifiedData);
        }
      } else if (data.status === "Completed") {
        data.noofrooms = rooms;
        data.noofdays = diffInDays;
        data.totalRoomNights = totalRoomNights;

        const modifiedData = {
          ...data,
          hotels: data.hotels.map((hotel  :any ) => {
            let pricePerRoomPerNight :any;
            let pricePerRoomPerNightPublish  :any ;
            let pricefortotalrooms :any;
        
            if (hotel.rate.providerName === "RateHawk") {
              pricePerRoomPerNight =
                (hotel.rate.totalRate / totalRoomNights) * priceDroppingValue;
              pricePerRoomPerNightPublish = hotel.rate.baseRate / totalRoomNights;
              const totalRateCeil = Math.ceil(hotel.rate.totalRate);
              pricefortotalrooms = totalRateCeil * priceDroppingValue;
            } else {
              pricePerRoomPerNight =
                (hotel.rate.totalRate / diffInDays) * priceDroppingValue;
              pricePerRoomPerNightPublish = hotel.rate.baseRate / diffInDays;
              const totalRateCeil = Math.ceil(hotel.rate.totalRate);
              pricefortotalrooms =
                totalRateCeil * rooms * priceDroppingValue;
            }
        
            // Calculate the new total rate with the priceDroppingValue factor
            const newTotalRate = hotel.rate.totalRate * priceDroppingValue;
            const newBaseRate = hotel.rate.baseRate * priceIncreaseValue;
        
            // Calculate the fee as the difference between the original total rate and the new total rate
            const feeAmount =
              hotel.rate.totalRate * priceReAddedValue;
        
            // Create the new rate component object with type "Fee"
            const feeComponent = {
              amount: feeAmount,
              description: "Agency Fee",
              type: "Fee",
            };
        
            // Add the fee component to the rate's otherRateComponents array
            const updatedRate = {
              totalRate: Math.ceil(newTotalRate),
              baseRate: Math.ceil(newBaseRate),
              providerName: hotel.rate.providerName,
              otherRateComponents: [feeComponent],
              cancellationPolicy: hotel.rate.cancellationPolicy,
              dailyTotalRate: Math.ceil(pricePerRoomPerNight),
              dailyPublishedRate: Math.ceil(pricePerRoomPerNightPublish * priceIncreaseValue),
              totalTripRate: Math.ceil(pricefortotalrooms),
            };
        
            return {
              id: hotel.id,
              relevanceScore: hotel.relevanceScore,
              rate: updatedRate,
              options: hotel.options,
            };
          }),
        };
        
        return modifiedData;

      }
    } catch (error) {
      // Handle errors and retry logic
      if (noOfCallingTimes < 3) {
        noOfCallingTimes++;
        return new Promise(async (resolve) => {
          setTimeout(async () => {
            const newData = await this.getAllHotels(token, headers, diffInDays, totalRoomNights, rooms, resultkey);
            resolve(newData);
          }, 500);
        });
      } else {
        throw new HttpException('Failed to call the API three times', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private async roomAndRates(data : any , diffInDays : number , totalRoomNights : number ) {
    // Implement your logic to get hotel data from the Zentrumhub API
    // Example:
    try {
        const priceDroppingValue = await this.getThepriceDroppingValue();
        const priceReAddedValue = await this.getThepriceReaddedValue();
        const priceIncreaseValue = await this.getThepriceIncreaseValue();
        
        data.totalRoomNights = totalRoomNights;
        data.diffInDays = diffInDays;
        data?.hotel?.rates.forEach((rate : any) => {
          const pricePerRoomPerNight =
            (rate.totalRate / diffInDays) * priceDroppingValue;
          const pricePerRoomPerNightPublish =
            rate.publishedRate / diffInDays;
          // Modify totalRate and publishedRate

          // Calculate the new total rate with the priceDroppingValue factor
          const newTotalRate = rate.totalRate * priceDroppingValue;
          const newBaseRate = rate.baseRate * priceIncreaseValue;

          // Calculate the fee as the difference between the original total rate and the new total rate
          const feeAmount = rate.totalRate * priceReAddedValue;

          // Create the new rate component object with type "Fee"
          const feeComponent = {
            amount: feeAmount,
            description: "Agency Fee",
            type: "Fee",
          };

          // Add the fee component to the rate's otherRateComponents array
          rate.otherRateComponents.push(feeComponent);

          // Modify totalRate and publishedRate
          rate.totalRate = Math.ceil(newTotalRate);
          rate.baseRate = Math.ceil(newBaseRate);

          rate.dailyTotalRate = Math.ceil(pricePerRoomPerNight);
          rate.dailyPublishedRate = Math.ceil(pricePerRoomPerNightPublish * priceIncreaseValue);
        });

        return data;
     
    } catch (error) {
      // Handle errors and retry logic
        throw new HttpException('Failed to call the API three times', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async recommendationRoomsAndRates(data : any ) {
    // Implement your logic to get hotel data from the Zentrumhub API
    // Example:
    try {
        const priceDroppingValue = await this.getThepriceDroppingValue();
        const priceReAddedValue = await this.getThepriceReaddedValue();
        const priceIncreaseValue = await this.getThepriceIncreaseValue();
        
        data?.hotel?.rates.forEach((rate : any) => {
          // Calculate the new total rate with the priceDroppingValue factor
           const newTotalRate = rate.totalRate * priceDroppingValue;
           const newBaseRate = rate.baseRate * priceIncreaseValue;
 
           // Calculate the fee as the difference between the original total rate and the new total rate
           const feeAmount = rate.totalRate * priceReAddedValue;
 
           // Create the new rate component object with type "Fee"
           const feeComponent = {
             amount: feeAmount,
             description: "Agency Fee",
             type: "Fee",
           };

           // Add the fee component to the rate's otherRateComponents array
           rate.otherRateComponents.push(feeComponent);
 
           // Modify totalRate and publishedRate
           rate.totalRate = Math.ceil(newTotalRate);
           rate.baseRate = Math.ceil(newBaseRate);
         });

        return data;
     
    } catch (error) {
      // Handle errors and retry logic
        throw new HttpException('Failed to call the API three times', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async basicHotelContent(reqBody: any) {

    const { ipAddress, correlationId } = reqBody;
    const { lat, long } = reqBody.searchParams.location.coordinates;

    const payload = {
      channelId: process.env.ZENTRUMHUB_LIVE_CHANNEL_ID,
      destinationCountryCode: null,
      filterBy: null,
      culture: process.env.ZENTRUMHUB_CULTURE,
      contentFields: ["basic", "masterfacilities"],
      distanceFrom: {
        lat: lat,
        long: long,
      },
      circularRegion: {
        centerLat: lat,
        centerLong: long,
        radiusInKm: 30,
      },
      rectangularRegion: null,
      polygonalRegion: null,
      multiPolygonalRegion: null,
      hotelIds: null,
    };

    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_CONTENT_API_URL}/hotelcontent/getHotelContent`, payload, { headers });
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const data = zentrumhubResponse.data;

      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initialCallOfZentrumhub(reqBody: any) {

    const startDate = reqBody.searchParams.startDate;
    const endDate = reqBody.searchParams.endDate;
    const occupancies = reqBody.searchParams.occupancies;
    const lat = reqBody.searchParams.location.coordinates.lat;
    const long = reqBody.searchParams.location.coordinates.long;
    const currency = reqBody.currency;
    const ipAddress = reqBody.ipAddress;
    const correlationId = reqBody.correlationId;

    const diffInDays = moment(endDate).diff(moment(startDate), 'days');

    const outputDate = this.formatDate(startDate);
    const outputDate2 = this.formatDate(endDate);
    const rooms = reqBody.searchParams.occupancies.length;
    const totalRoomNights = this.calculateTotalRoomNights(startDate, endDate, rooms);

    const payload = {
      channelId: process.env.ZENTRUMHUB_LIVE_CHANNEL_ID,
      segmentId: null,
      currency: currency,
      culture: process.env.ZENTRUMHUB_CULTURE,
      checkIn: outputDate,
      checkOut: outputDate2,
      occupancies: occupancies,
      circularRegion: {
        centerLat: lat,
        centerLong: long,
        radiusInKm: 30,
      },
      rectangularRegion: null,
      polygonalRegion: null,
      multiPolygonalRegion: null,
      hotelIds: null,
      nationality: process.env.ZENTRUMHUB_NATIONALITY,
      countryOfResidence: process.env.ZENTRUMHUB_COUNTRY_OF_RESIDENCE,
      destinationCountryCode: null,
      filterBy: null,
    };

    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_API_URL}/availability/init`, payload, { headers });
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const token = zentrumhubResponse.data.token;

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.getAllHotels(token, headers, diffInDays, totalRoomNights, rooms , null);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error creating a token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initalCallOfZentrumhubRateHawk(reqBody: any) {

    const startDate = reqBody.searchParams.startDate;
    const endDate = reqBody.searchParams.endDate;
    const occupancies = reqBody.searchParams.occupancies;
    const lat = reqBody.searchParams.location.coordinates.lat;
    const long = reqBody.searchParams.location.coordinates.long;
    const currency = reqBody.currency;
    const ipAddress = reqBody.ipAddress;
    const correlationId = reqBody.correlationId;

    const diffInDays = moment(endDate).diff(moment(startDate), 'days');

    const outputDate = this.formatDate(startDate);
    const outputDate2 = this.formatDate(endDate);
    const rooms = reqBody.searchParams.occupancies.length;
    const totalRoomNights = this.calculateTotalRoomNights(startDate, endDate, rooms);

    const payload = {
      channelId: process.env.ZENTRUMHUB_WEB_CHANNEL_ID,
      segmentId: null,
      currency: currency,
      culture: process.env.ZENTRUMHUB_CULTURE,
      checkIn: outputDate,
      checkOut: outputDate2,
      occupancies: occupancies,
      circularRegion: {
        centerLat: lat,
        centerLong: long,
        radiusInKm: 30,
      },
      rectangularRegion: null,
      polygonalRegion: null,
      multiPolygonalRegion: null,
      hotelIds: null,
      nationality: process.env.ZENTRUMHUB_NATIONALITY,
      countryOfResidence: process.env.ZENTRUMHUB_COUNTRY_OF_RESIDENCE,
      destinationCountryCode: null,
      filterBy: null,
    };

    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_API_URL}/availability/init`, payload, { headers });
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const token = zentrumhubResponse.data.token;

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.getAllHotels(token, headers, diffInDays, totalRoomNights, rooms ,null);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error creating a token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async nextAsyncHotelData(token : string , resultkey : any , reqBody: any) {

    const { ipAddress, correlationId, totalRoomNights, noofrooms } = reqBody;
    const diffInDays = reqBody.noofdays;

    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.getAllHotels(token, headers, diffInDays, totalRoomNights, noofrooms , resultkey);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error creating a token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async singleHotelData(reqBody: any) {

    const { id, ipAddress, correlationId } = reqBody;

    const payload = {
      channelId: process.env.ZENTRUMHUB_LIVE_CHANNEL_ID,
      culture: process.env.ZENTRUMHUB_CULTURE,
      includeAllProviders: true,
      hotelIds: [id],
      filterBy: null,
      contentFields: ["All"],
    };

    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_CONTENT_API_URL}/hotelcontent/getHotelContent`, payload, { headers });
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const data = zentrumhubResponse.data;

      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initRoomAndRatesToken(reqBody: any) {

    const {
      ipAddress,
      correlationId,
      checkIn,
      checkOut,
      occupancies,
      currency,
      id,
    } = reqBody;

    const diffInDays = moment(checkOut).diff(moment(checkIn), "days");

    const outputDate = this.formatDate(checkIn);
    const outputDate2 = this.formatDate(checkOut);
    const rooms = occupancies.length;
    const totalRoomNights = this.calculateTotalRoomNights(checkIn, checkOut, rooms);

    const payload = {
      channelId: process.env.ZENTRUMHUB_LIVE_CHANNEL_ID,
      currency: currency,
      culture: process.env.ZENTRUMHUB_CULTURE,
      checkIn: outputDate,
      checkOut: outputDate2,
      occupancies: occupancies,
      nationality: process.env.ZENTRUMHUB_NATIONALITY,
      countryOfResidence: process.env.ZENTRUMHUB_COUNTRY_OF_RESIDENCE,
    };

    const headers = this.generateHeaders(ipAddress, correlationId);
    const HotelID = parseInt(id);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_API_URL}/${HotelID}/roomsandrates`, payload, { headers });
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.roomAndRates(responseData, diffInDays, totalRoomNights);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initRoomAndRatesTokenRateHawk(reqBody: any) {

    const {
      ipAddress,
      correlationId,
      checkIn,
      checkOut,
      occupancies,
      currency,
      id,
    } = reqBody;

    const diffInDays = moment(checkOut).diff(moment(checkIn), "days");

    const outputDate = this.formatDate(checkIn);
    const outputDate2 = this.formatDate(checkOut);
    const rooms = occupancies.length;
    const totalRoomNights = this.calculateTotalRoomNights(checkIn, checkOut, rooms);

    const payload = {
      channelId: process.env.ZENTRUMHUB_WEB_CHANNEL_ID,
      currency: currency,
      culture: process.env.ZENTRUMHUB_CULTURE,
      checkIn: outputDate,
      checkOut: outputDate2,
      occupancies: occupancies,
      nationality: process.env.ZENTRUMHUB_NATIONALITY,
      countryOfResidence: process.env.ZENTRUMHUB_COUNTRY_OF_RESIDENCE,
    };

    const headers = this.generateHeaders(ipAddress, correlationId);
    const HotelID = parseInt(id);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_API_URL}/${HotelID}/roomsandrates`, payload, { headers });
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.roomAndRates(responseData, diffInDays, totalRoomNights);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async priceCheckingRecommendation(reqBody: any) {

    const {
      ipAddress,
      correlationId,
      id,
      roomtoken,
      selectedRecommendation,
    } = reqBody;

    const headers = this.generateHeaders(ipAddress, correlationId);
    const HotelID = parseInt(id);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.get(`${process.env.ZENTRUMHUB_API_URL}/${HotelID}/${roomtoken}/price/recommendation/${selectedRecommendation}`, { headers });
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Wrap the setTimeout in a Promise
      const modifiedData = await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const data = this.recommendationRoomsAndRates(responseData);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 1500);
      });

      // Return the modifiedData
      return modifiedData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async roomBookingZentrumhub(reqBody: any) {

    const { data, ipAddress, correlationId, hotelId, roomtoken } = reqBody;


    const headers = this.generateHeaders(ipAddress, correlationId);

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.ZENTRUMHUB_API_URL}/${hotelId}/${roomtoken}/book`, data , { headers });
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Return the responseData
      return responseData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}