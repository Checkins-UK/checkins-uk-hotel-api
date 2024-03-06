import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as moment from 'moment';
import { DataSource } from 'typeorm';

@Injectable()
export class ZentrumhubService {

  constructor(private readonly connection: DataSource) {}

  async basicHotelContent(reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/hotels/content/hotelcontent/getHotelContent`, reqBody);
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const data = zentrumhubResponse.data;

      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initialCallOfZentrumhub(reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/hotels/availability`, reqBody);
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const data = zentrumhubResponse.data;

      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error creating a token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async nextAsyncHotelData(token : string , resultkey : any , reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {

      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/hotels/availability/async/${token}/${resultkey}`);
      
      if(zentrumhubResponse.data.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      const data = zentrumhubResponse.data;

      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error creating a token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async singleHotelData(reqBody: any) {
    console.log(reqBody);
    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/content/individualHotel/getHotelContent`, reqBody);
      
      const data = zentrumhubResponse.data;
      console.log(data);
      return data;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initRoomAndRatesToken(reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/rates/individualHotel/roomAndRates/availability/init`, reqBody);
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Return the modifiedData
      return responseData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async priceCheckingRecommendation(reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/rates/individualHotel/roomAndRates/availability`,reqBody);
      
      if(zentrumhubResponse?.data?.error) throw new HttpException(zentrumhubResponse.data.error, HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data?.hotel?.rates.length === 0) throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      if(zentrumhubResponse?.data === "") throw new HttpException('No data found', HttpStatus.INTERNAL_SERVER_ERROR);

      const responseData = zentrumhubResponse.data;

      // Return the modifiedData
      return responseData;
      
    } catch (error) {
      console.error(error);
      throw new HttpException('Error getting the data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async roomBookingZentrumhub(reqBody: any) {

    // Implement the logic to make the initial API call and retrieve the token
    try {
      const zentrumhubResponse = await axios.post(`${process.env.CHECKINS_HUB_API_ENDPOINT}/api/v1/booking`, reqBody);
      
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
